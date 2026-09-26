// Receives estimate requests from the site form and emails them to the owner.
// Needs two environment variables in Vercel (Project Settings, Environment Variables):
//   RESEND_API_KEY  an API key from resend.com
//   LEAD_TO_EMAIL   where requests go, for example estimates@completedeckandfence.com
// Optional: LEAD_FROM_EMAIL, a sender on a domain verified in Resend.
// Until both are set, the form tells visitors online requests are not connected yet.

const MAX = { name: 120, phone: 40, email: 160, zip: 10, notes: 3000, project: 40, timeline: 40, page: 200 };
const clean = (v, n) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, n);
const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  if (body.company) return res.status(200).json({ ok: true }); // honeypot filled: quietly drop

  const lead = Object.fromEntries(Object.entries(MAX).map(([k, n]) => [k, clean(body[k], n)]));
  const problems = [];
  if (!lead.project) problems.push("project");
  if (!lead.name) problems.push("name");
  if (lead.phone.replace(/\D/g, "").length < 10) problems.push("phone");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) problems.push("email");
  if (!/^\d{5}$/.test(lead.zip)) problems.push("zip");
  if (problems.length) return res.status(400).json({ ok: false, error: "invalid", fields: problems });

  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO_EMAIL;
  if (!key || !to) return res.status(503).json({ ok: false, error: "not_configured" });

  const rows = [
    ["Project", lead.project], ["Start", lead.timeline || "Not given"], ["Name", lead.name],
    ["Phone", lead.phone], ["Email", lead.email], ["ZIP", lead.zip], ["Notes", lead.notes || "None"], ["Sent from", lead.page],
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `<table>${rows.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.LEAD_FROM_EMAIL || "Complete Deck & Fence <onboarding@resend.dev>",
        to: to.split(",").map((s) => s.trim()),
        reply_to: lead.email,
        subject: `Estimate request: ${lead.project} in ${lead.zip} from ${lead.name}`,
        text,
        html,
      }),
    });
    if (!r.ok) throw new Error(`resend ${r.status}`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("estimate send failed", err);
    return res.status(502).json({ ok: false, error: "send_failed" });
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
