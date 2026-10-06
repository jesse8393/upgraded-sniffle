// Receives estimate requests from the site form and puts every valid one straight into
// GoHighLevel. Secrets live only in Vercel environment variables (Project Settings,
// Environment Variables). Nothing here reaches the browser, and the token is never logged.
//
// Required:
//   GHL_PRIVATE_TOKEN   private integration token. Scopes: contacts.readonly, contacts.write,
//                       opportunities.readonly, opportunities.write, locations/customFields.readonly
//   GHL_LOCATION_ID     the sub account (location) id
// Optional:
//   GHL_API_VERSION     API version header, 2021-07-28 by default
//   RESEND_API_KEY      when set, every submission is also emailed as a backup to
//                       LEAD_TO_EMAIL (default completedeckandfence@gmail.com), sent from
//                       LEAD_FROM_EMAIL (a sender on a domain verified in Resend)
//
// For each request: create or update the contact, add its tags, open an opportunity in the
// "New Lead" stage of the "Deck & Fence Jobs" pipeline (or add a note when one is already
// open), and save a note with every answer plus the text consent record. The visitor gets
// 200 only once the contact exists in GoHighLevel; anything else is an error, and the page
// asks them to call or text instead. There is no email app fallback.

import { SMS_CONSENT } from "../src/lib/sms.js";

const MAX = { name: 120, phone: 40, email: 160, zip: 10, notes: 3000, project: 40, timeline: 40, page: 200 };
const clean = (v, n) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, n);
const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const checked = (v) => v === true || v === "yes" || v === "on" || v === "true";

const GHL_BASE = "https://services.leadconnectorhq.com";
const SOURCE = "Website Estimate Form";
const PIPELINE_NAME = "deck & fence jobs";
const STAGE_NAME = "new lead";
const BASE_TAGS = ["website lead", "estimate request"];
const SMS_TAGS = { transactional: "sms consent transactional", marketing: "sms consent marketing" };
const FIELD_NAMES = { project: "project type", timeline: "timeline", notes: ["notes", "project notes"] };
const TIMEOUT_MS = 8000;
const MIN_FILL_MS = 3000;
const RATE = { max: 5, windowMs: 10 * 60 * 1000 };
const BACKUP_TO = "completedeckandfence@gmail.com";
const TEST_LEAD_NAME = "website test lead";

// Per IP rate limit. It lives in the warm function instance, which is enough to stop a
// burst from one address; it is not a shared counter across every instance.
const hits = new Map();
function rateLimited(ip, now) {
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v.at(-1) > RATE.windowMs) hits.delete(k);
  return recent.length > RATE.max;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  if (body.company) return res.status(200).json({ ok: true }); // honeypot filled: quietly drop

  // Sent by the page script: how long the form was open before it was sent.
  const elapsed = Number(body.elapsed_ms);
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return res.status(400).json({ ok: false, error: "too_fast" });

  const now = Date.now();
  const ip = clientIp(req);
  if (rateLimited(ip, now)) return res.status(429).json({ ok: false, error: "rate_limited" });

  const lead = Object.fromEntries(Object.entries(MAX).map(([k, n]) => [k, clean(body[k], n)]));
  lead.smsTransactional = checked(body.sms_transactional_consent);
  lead.smsMarketing = checked(body.sms_marketing_consent);
  lead.receivedAt = new Date(now).toISOString();
  lead.ip = ip;
  lead.userAgent = clean(req.headers?.["user-agent"], 300);
  const digits = lead.phone.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  const problems = [];
  if (!lead.project) problems.push("project");
  if (!lead.name) problems.push("name");
  if (digits.length !== 10) problems.push("phone");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) problems.push("email");
  if (!/^\d{5}$/.test(lead.zip)) problems.push("zip");
  if (problems.length) return res.status(400).json({ ok: false, error: "invalid", fields: problems });
  lead.phoneE164 = `+1${digits}`;
  const [firstName, ...rest] = lead.name.split(/\s+/);
  lead.firstName = firstName;
  lead.lastName = rest.join(" ");

  const env = process.env;
  const backup = env.RESEND_API_KEY
    ? sendBackupEmail(lead, env).catch((err) => console.error("estimate backup email failed:", err.message))
    : null;

  if (!env.GHL_PRIVATE_TOKEN || !env.GHL_LOCATION_ID) {
    console.error("estimate not delivered: GHL_PRIVATE_TOKEN or GHL_LOCATION_ID is not set");
    await backup;
    return res.status(503).json({ ok: false, error: "not_configured" });
  }

  try {
    await sendToGhl(lead, env);
  } catch (err) {
    console.error("estimate gohighlevel failed:", err.message);
    await backup;
    return res.status(502).json({ ok: false, error: "send_failed" });
  }
  await backup;
  return res.status(200).json({ ok: true });
}

function clientIp(req) {
  const h = req.headers || {};
  return clean(String(h["x-forwarded-for"] || h["x-real-ip"] || req.socket?.remoteAddress || "unknown").split(",")[0], 64);
}

function answerRows(lead) {
  return [
    ["Project", lead.project], ["When to start", lead.timeline || "Not given"], ["Name", lead.name],
    ["Phone", lead.phone], ["Email", lead.email], ["ZIP", lead.zip], ["Notes", lead.notes || "None"],
  ];
}

// Proof of opt in for the texting registration: the exact wording shown, the answer, when,
// where, and from which browser.
function consentRows(lead) {
  return [
    ["Text box 1 wording", SMS_CONSENT.transactional],
    ["Text box 1 checked (sms_transactional_consent)", lead.smsTransactional ? "Yes" : "No"],
    ["Text box 2 wording", SMS_CONSENT.marketing],
    ["Text box 2 checked (sms_marketing_consent)", lead.smsMarketing ? "Yes" : "No"],
    ["Submitted (UTC)", lead.receivedAt],
    ["Page", lead.page || "Not given"],
    ["IP address", lead.ip],
    ["User agent", lead.userAgent || "Not given"],
  ];
}

const rowsText = (rows) => rows.map(([k, v]) => `${k}: ${v}`).join("\n");

async function sendToGhl(lead, env) {
  const ghl = ghlClient(env);
  const loc = env.GHL_LOCATION_ID;

  // Lookups run alongside the upsert. A failed lookup never blocks the contact.
  const fieldsLookup = resolveFields(ghl, loc).catch((err) => { console.error("gohighlevel custom fields lookup failed:", err.message); return {}; });
  const stageLookup = resolveStage(ghl, loc).catch((err) => ({ error: err }));

  const fields = await fieldsLookup;
  const customFields = [
    fields.project && { id: fields.project, field_value: lead.project },
    fields.timeline && lead.timeline && { id: fields.timeline, field_value: lead.timeline },
    fields.notes && lead.notes && { id: fields.notes, field_value: lead.notes },
  ].filter(Boolean);

  const contact = {
    locationId: loc,
    firstName: lead.firstName,
    lastName: lead.lastName || undefined,
    name: lead.name,
    email: lead.email,
    phone: lead.phoneE164,
    postalCode: lead.zip,
    source: SOURCE,
  };
  let upsert;
  let fieldsNote = "";
  try {
    upsert = await ghl("POST", "/contacts/upsert", customFields.length ? { ...contact, customFields } : contact);
  } catch (err) {
    // A custom field value GoHighLevel will not accept must not cost us the lead.
    if (!customFields.length || ![400, 422].includes(err.status)) throw err;
    console.error("gohighlevel upsert with custom fields failed, saving without them:", err.message);
    fieldsNote = "\n\nCustom fields were not saved because GoHighLevel rejected them; the answers above are the record.";
    upsert = await ghl("POST", "/contacts/upsert", contact);
  }
  const contactId = upsert?.contact?.id;
  if (!contactId) throw new Error("gohighlevel upsert returned no contact id");

  // Added with the tags endpoint so tags already on a returning contact are kept.
  const tags = [
    ...BASE_TAGS,
    lead.project.toLowerCase(),
    ...(lead.smsTransactional ? [SMS_TAGS.transactional] : []),
    ...(lead.smsMarketing ? [SMS_TAGS.marketing] : []),
    // The live check submits this exact name; the tag lets the owner find and delete it.
    ...(lead.name.toLowerCase() === TEST_LEAD_NAME ? ["test"] : []),
  ];
  const note = `Website estimate request\n\n${rowsText(answerRows(lead))}\n\nText message consent record\n${rowsText(consentRows(lead))}${fieldsNote}`;

  const steps = [
    ["tags", () => ghl("POST", `/contacts/${contactId}/tags`, { tags })],
    ["note", () => ghl("POST", `/contacts/${contactId}/notes`, { body: note })],
    ["opportunity", async () => {
      const stage = await stageLookup;
      if (stage.error) throw stage.error;
      const open = await ghl("GET", `/opportunities/search?${new URLSearchParams({ location_id: loc, pipeline_id: stage.pipelineId, contact_id: contactId, status: "open" })}`);
      const existing = (open.opportunities || [])[0];
      if (existing) {
        return ghl("POST", `/contacts/${contactId}/notes`, {
          body: `Another website estimate request came in at ${lead.receivedAt} (${lead.project}, ${lead.zip}). An open opportunity already exists in this pipeline${existing.name ? `: ${existing.name}` : ""}, so no second one was created.`,
        });
      }
      return ghl("POST", "/opportunities/", {
        locationId: loc,
        pipelineId: stage.pipelineId,
        pipelineStageId: stage.stageId,
        contactId,
        name: `${lead.name} ${lead.project} estimate`,
        status: "open",
        source: SOURCE,
      });
    }],
  ];
  const settled = await Promise.allSettled(steps.map(([, run]) => run()));
  settled.forEach((r, i) => {
    if (r.status === "rejected") console.error(`gohighlevel ${steps[i][0]} failed for contact ${contactId}:`, r.reason?.message || r.reason);
  });
  return contactId;
}

// Every call is retried once on a network error, a timeout, 429, or a 5xx.
function ghlClient(env) {
  const headers = {
    Authorization: `Bearer ${env.GHL_PRIVATE_TOKEN}`,
    Version: env.GHL_API_VERSION || "2021-07-28",
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const once = async (method, path, payload) => {
    const r = await fetch(GHL_BASE + path, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await r.text();
    if (!r.ok) {
      // Error bodies can echo request data, so keep only a short excerpt. Headers are never logged.
      const err = new Error(`gohighlevel ${method} ${path.split("?")[0]} ${r.status} ${text.slice(0, 200)}`);
      err.status = r.status;
      throw err;
    }
    return text ? safeParse(text) : {};
  };
  return async (method, path, payload) => {
    try {
      return await once(method, path, payload);
    } catch (err) {
      if (err.status && err.status !== 429 && err.status < 500) throw err;
      return once(method, path, payload);
    }
  };
}

// Field and stage ids rarely change, so a warm function keeps them.
let cachedFields = null;
async function resolveFields(ghl, loc) {
  if (cachedFields) return cachedFields;
  const data = await ghl("GET", `/locations/${encodeURIComponent(loc)}/customFields`);
  const byName = new Map((data.customFields || []).map((f) => [String(f.name || "").trim().toLowerCase(), f.id]));
  return (cachedFields = {
    project: byName.get(FIELD_NAMES.project),
    timeline: byName.get(FIELD_NAMES.timeline),
    notes: FIELD_NAMES.notes.map((n) => byName.get(n)).find(Boolean),
  });
}

let cachedStage = null;
async function resolveStage(ghl, loc) {
  if (cachedStage) return cachedStage;
  const data = await ghl("GET", `/opportunities/pipelines?locationId=${encodeURIComponent(loc)}`);
  const pipeline = (data.pipelines || []).find((p) => String(p.name || "").trim().toLowerCase() === PIPELINE_NAME);
  if (!pipeline) throw new Error('gohighlevel has no pipeline named "Deck & Fence Jobs"');
  const stage = (pipeline.stages || []).find((s) => String(s.name || "").trim().toLowerCase() === STAGE_NAME);
  if (!stage) throw new Error('gohighlevel pipeline "Deck & Fence Jobs" has no stage named "New Lead"');
  return (cachedStage = { pipelineId: pipeline.id, stageId: stage.id });
}

async function sendBackupEmail(lead, env) {
  const rows = [...answerRows(lead), ...consentRows(lead)];
  const html = `<table>${rows.map(([k, v]) => `<tr><td><b>${escapeHtml(k)}</b></td><td>${escapeHtml(String(v)).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.LEAD_FROM_EMAIL || "Complete Deck & Fence <onboarding@resend.dev>",
      to: (env.LEAD_TO_EMAIL || BACKUP_TO).split(",").map((s) => s.trim()),
      reply_to: lead.email,
      subject: `Estimate request: ${lead.project} in ${lead.zip} from ${lead.name}`,
      text: rowsText(rows),
      html,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!r.ok) throw new Error(`resend ${r.status}`);
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
