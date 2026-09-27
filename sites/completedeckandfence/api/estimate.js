// Receives estimate requests from the site form and sends them to GoHighLevel,
// and to email too when email is set up. Secrets live only in Vercel environment
// variables (Project Settings, Environment Variables). Nothing here reaches the browser.
//
// GoHighLevel (the CRM):
//   GHL_PRIVATE_TOKEN   private integration token. Scopes: contacts.write,
//                       contacts.readonly, opportunities.write, opportunities.readonly
//   GHL_LOCATION_ID     the sub account (location) id
// Optional:
//   GHL_PIPELINE_ID     pipeline to create opportunities in. Without it, the first
//                       pipeline with a stage named "New lead" is used.
//   GHL_STAGE_ID        stage id, if you want to skip the lookup by name
//   GHL_API_VERSION     API version header, 2021-07-28 by default
//
// Email through Resend, optional:
//   RESEND_API_KEY, LEAD_TO_EMAIL, and LEAD_FROM_EMAIL (a sender on a verified domain)
//
// Each request goes to every destination that is set up. The visitor sees the thank
// you message when at least one of them accepts it. With none set up, this returns 503
// and the form opens the visitor's email app addressed to SITE.email instead.
//
// Text consent: the form always sends sms_transactional_consent and sms_marketing_consent
// as true or false. Each yes adds a matching tag in GoHighLevel, and the note on the
// contact records the time, the page, and the exact wording the visitor agreed to.

import { SMS_CONSENT } from "../src/lib/sms.js";

const MAX = { name: 120, phone: 40, email: 160, zip: 10, notes: 3000, project: 40, timeline: 40, page: 200 };
const clean = (v, n) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, n);
const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_TAG = "website estimate";
const GHL_SOURCE = "Website";
const GHL_STAGE_NAME = "new lead";
// Added only when the visitor checked the matching box, so GoHighLevel can filter on them.
const GHL_SMS_TAGS = { transactional: "sms transactional consent", marketing: "sms marketing consent" };
const checked = (v) => v === true || v === "yes" || v === "on" || v === "true";
const TIMEOUT_MS = 8000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  if (body.company) return res.status(200).json({ ok: true }); // honeypot filled: quietly drop

  const lead = Object.fromEntries(Object.entries(MAX).map(([k, n]) => [k, clean(body[k], n)]));
  // Both text boxes are optional and unchecked by default; anything but an explicit yes is a no.
  lead.smsTransactional = checked(body.sms_transactional_consent);
  lead.smsMarketing = checked(body.sms_marketing_consent);
  lead.receivedAt = new Date().toISOString();
  const problems = [];
  if (!lead.project) problems.push("project");
  if (!lead.name) problems.push("name");
  if (lead.phone.replace(/\D/g, "").length < 10) problems.push("phone");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) problems.push("email");
  if (!/^\d{5}$/.test(lead.zip)) problems.push("zip");
  if (problems.length) return res.status(400).json({ ok: false, error: "invalid", fields: problems });

  const env = process.env;
  const destinations = [];
  if (env.GHL_PRIVATE_TOKEN && env.GHL_LOCATION_ID) destinations.push(["gohighlevel", () => sendToGhl(lead, env)]);
  if (env.RESEND_API_KEY && env.LEAD_TO_EMAIL) destinations.push(["email", () => sendEmail(lead, env)]);
  if (!destinations.length) return res.status(503).json({ ok: false, error: "not_configured" });

  const results = await Promise.allSettled(destinations.map(([, send]) => send()));
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`estimate ${destinations[i][0]} failed:`, r.reason?.message || r.reason);
  });
  if (results.some((r) => r.status === "fulfilled")) return res.status(200).json({ ok: true });
  return res.status(502).json({ ok: false, error: "send_failed" });
}

function detailRows(lead) {
  return [
    ["Project", lead.project], ["Start", lead.timeline || "Not given"], ["Name", lead.name],
    ["Phone", lead.phone], ["Email", lead.email], ["ZIP", lead.zip], ["Notes", lead.notes || "None"], ["Sent from", lead.page],
    ["Texts about the estimate (sms_transactional_consent)", lead.smsTransactional ? "Yes" : "No"],
    ["Texts with offers (sms_marketing_consent)", lead.smsMarketing ? "Yes" : "No"],
    ["Received", lead.receivedAt],
  ];
}

// A record of exactly what the visitor agreed to, kept with the contact in GoHighLevel.
function consentRecord(lead) {
  const lines = [];
  if (lead.smsTransactional) lines.push(`Opted in to estimate and project texts at ${lead.receivedAt} on ${lead.page || "the website"}. Wording shown: "${SMS_CONSENT.transactional}"`);
  if (lead.smsMarketing) lines.push(`Opted in to offer texts at ${lead.receivedAt} on ${lead.page || "the website"}. Wording shown: "${SMS_CONSENT.marketing}"`);
  if (!lines.length) lines.push("Did not opt in to texts.");
  return lines.join("\n\n");
}

// GoHighLevel: create or update the contact, tag it (plus a tag for each text box checked),
// save the details and the text consent record as a note,
// and open an opportunity in the New lead stage. The request counts as delivered
// once the contact exists, so a visitor is never told to send it again after that.
async function sendToGhl(lead, env) {
  const ghl = ghlClient(env);
  const stageLookup = resolveStage(ghl, env).catch((err) => ({ error: err }));

  const digits = lead.phone.replace(/\D/g, "").slice(-10);
  const [firstName, ...rest] = lead.name.split(/\s+/);
  const upsert = await ghl("POST", "/contacts/upsert", {
    locationId: env.GHL_LOCATION_ID,
    firstName,
    lastName: rest.join(" ") || undefined,
    name: lead.name,
    email: lead.email,
    phone: `+1${digits}`,
    postalCode: lead.zip,
    source: GHL_SOURCE,
  });
  const contactId = upsert?.contact?.id;
  if (!contactId) throw new Error("gohighlevel upsert returned no contact id");

  const note = detailRows(lead).map(([k, v]) => `${k}: ${v}`).join("\n");
  const followUps = [
    ["tag", () => ghl("POST", `/contacts/${contactId}/tags`, { tags: [
      GHL_TAG,
      ...(lead.smsTransactional ? [GHL_SMS_TAGS.transactional] : []),
      ...(lead.smsMarketing ? [GHL_SMS_TAGS.marketing] : []),
    ] })],
    ["note", () => ghl("POST", `/contacts/${contactId}/notes`, { body: `Website estimate request\n\n${note}\n\nText message consent\n${consentRecord(lead)}` })],
    ["opportunity", async () => {
      const stage = await stageLookup;
      if (stage.error) throw stage.error;
      return ghl("POST", "/opportunities/", {
        locationId: env.GHL_LOCATION_ID,
        pipelineId: stage.pipelineId,
        pipelineStageId: stage.stageId,
        contactId,
        name: `${lead.name}, ${lead.project}, ${lead.zip}`,
        status: "open",
        source: GHL_SOURCE,
      });
    }],
  ];
  const settled = await Promise.allSettled(followUps.map(([, run]) => run()));
  settled.forEach((r, i) => {
    if (r.status === "rejected") console.error(`gohighlevel ${followUps[i][0]} failed for contact ${contactId}:`, r.reason?.message || r.reason);
  });
}

function ghlClient(env) {
  const headers = {
    Authorization: `Bearer ${env.GHL_PRIVATE_TOKEN}`,
    Version: env.GHL_API_VERSION || "2021-07-28",
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  return async (method, path, payload) => {
    const r = await fetch(GHL_BASE + path, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await r.text();
    // Error bodies can echo request data, so log only the status and a short excerpt.
    if (!r.ok) throw new Error(`gohighlevel ${method} ${path.split("?")[0]} ${r.status} ${text.slice(0, 200)}`);
    return text ? safeParse(text) : {};
  };
}

// Stage ids stay the same between requests, so a warm function keeps the lookup.
let cachedStage = null;
async function resolveStage(ghl, env) {
  if (env.GHL_PIPELINE_ID && env.GHL_STAGE_ID) return { pipelineId: env.GHL_PIPELINE_ID, stageId: env.GHL_STAGE_ID };
  if (cachedStage) return cachedStage;
  const data = await ghl("GET", `/opportunities/pipelines?locationId=${encodeURIComponent(env.GHL_LOCATION_ID)}`);
  const pipelines = (data.pipelines || []).filter((p) => !env.GHL_PIPELINE_ID || p.id === env.GHL_PIPELINE_ID);
  for (const p of pipelines) {
    const stage = (p.stages || []).find((s) => s.name?.trim().toLowerCase() === GHL_STAGE_NAME);
    if (stage) return (cachedStage = { pipelineId: p.id, stageId: stage.id });
  }
  throw new Error(`gohighlevel has no stage named "New lead"${env.GHL_PIPELINE_ID ? " in GHL_PIPELINE_ID" : ""}`);
}

async function sendEmail(lead, env) {
  const rows = detailRows(lead);
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `<table>${rows.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.LEAD_FROM_EMAIL || "Complete Deck & Fence <onboarding@resend.dev>",
      to: env.LEAD_TO_EMAIL.split(",").map((s) => s.trim()),
      reply_to: lead.email,
      subject: `Estimate request: ${lead.project} in ${lead.zip} from ${lead.name}`,
      text,
      html,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!r.ok) throw new Error(`resend ${r.status}`);
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
