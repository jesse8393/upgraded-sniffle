// Tests for api/estimate.js with GoHighLevel and Resend mocked. No network calls, no real leads.
//   npm run test:estimate
import assert from "node:assert/strict";
let calls = [], plan = {}, n = 0;
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url); const key = `${init.method || "GET"} ${u.pathname}`;
  const c = { key, url, query: Object.fromEntries(u.searchParams), headers: init.headers, body: init.body ? JSON.parse(init.body) : null };
  calls.push(c);
  const p = plan[key];
  if (p) { const r = typeof p === "function" ? p(c) : p; if (r) return r; }
  if (u.hostname === "api.resend.com") return Response.json({ id: "e1" });
  if (key === "GET /locations/loc1/customFields") return Response.json({ customFields: [{ id: "f_proj", name: "Project Type" }, { id: "f_time", name: " Timeline " }, { id: "f_other", name: "Other" }] });
  if (key === "POST /contacts/upsert") return Response.json({ new: true, contact: { id: "c1" } });
  if (key === "GET /opportunities/pipelines") return Response.json({ pipelines: [{ id: "p0", name: "Other", stages: [{ id: "x", name: "New Lead" }] }, { id: "p1", name: "Deck & Fence Jobs", stages: [{ id: "s0", name: "Contacted" }, { id: "s1", name: "New Lead" }] }] });
  if (key === "GET /opportunities/search") return Response.json({ opportunities: [] });
  if (key === "POST /opportunities/") return Response.json({ opportunity: { id: "o1" } });
  return Response.json({ ok: true });
};
const fresh = async () => import(new URL("../api/estimate.js?" + (n++), import.meta.url).href);
let errors = [];
console.error = (...a) => errors.push(a.join(" "));
const run = async (mod, body, env = {}, ip = "1.2.3.4") => {
  for (const k of Object.keys(process.env)) if (/^(GHL_|RESEND|LEAD_)/.test(k)) delete process.env[k];
  Object.assign(process.env, env); calls = []; errors = [];
  let status, json; const res = { setHeader() {}, status(s) { status = s; return this; }, json(j) { json = j; return this; } };
  await mod.default({ method: "POST", body, headers: { "x-forwarded-for": `${ip}, 10.0.0.1`, "user-agent": "TestAgent/1.0" } }, res);
  return { status, json };
};
const lead = { project: "Fence", name: "Website Test Lead", phone: "(615) 555-0100", email: "t@example.com", zip: "37128", notes: "Back fence", timeline: "Just planning", page: "/contact/", sms_transactional_consent: true, sms_marketing_consent: false, elapsed_ms: 9000 };
const env = { GHL_PRIVATE_TOKEN: "secret-token-xyz", GHL_LOCATION_ID: "loc1" };
const out = [];

let m = await fresh();
// 1 happy path
let r = await run(m, lead, env, "9.9.9.1");
assert.equal(r.status, 200);
const up = calls.find((c) => c.key === "POST /contacts/upsert");
assert.equal(up.headers.Authorization, "Bearer secret-token-xyz"); assert.equal(up.headers.Version, "2021-07-28");
assert.deepEqual({ ...up.body, customFields: undefined }, { locationId: "loc1", firstName: "Website", lastName: "Test Lead", name: "Website Test Lead", email: "t@example.com", phone: "+16155550100", postalCode: "37128", source: "Website Estimate Form", customFields: undefined });
assert.deepEqual(up.body.customFields, [{ id: "f_proj", field_value: "Fence" }, { id: "f_time", field_value: "Just planning" }]);
assert.deepEqual(calls.find((c) => c.key === "POST /contacts/c1/tags").body.tags, ["website lead", "estimate request", "fence", "sms consent transactional", "test"]);
const note = calls.find((c) => c.key === "POST /contacts/c1/notes").body.body;
for (const s of ["Project: Fence", "When to start: Just planning", "Notes: Back fence", "Text box 1 wording: Yes, text me about my estimate", "Consent is not a condition of purchase.", "Text box 1 checked (sms_transactional_consent): Yes", "Text box 2 checked (sms_marketing_consent): No", "Submitted (UTC): 20", "Page: /contact/", "IP address: 9.9.9.1", "User agent: TestAgent/1.0"]) assert.ok(note.includes(s), s);
const search = calls.find((c) => c.key === "GET /opportunities/search");
assert.deepEqual(search.query, { location_id: "loc1", pipeline_id: "p1", contact_id: "c1", status: "open" });
assert.deepEqual(calls.find((c) => c.key === "POST /opportunities/").body, { locationId: "loc1", pipelineId: "p1", pipelineStageId: "s1", contactId: "c1", name: "Website Test Lead Fence estimate", status: "open", source: "Website Estimate Form" });
assert.ok(!JSON.stringify(errors).includes("secret-token-xyz"));
out.push("happy path: 200, upsert body, custom fields, tags, note with consent record, opportunity in Deck & Fence Jobs / New Lead");

// 2 cache: second call does not repeat lookups
r = await run(m, { ...lead, sms_marketing_consent: true, project: "Deck and fence" }, env, "9.9.9.2");
assert.equal(r.status, 200);
assert.equal(calls.filter((c) => c.key.includes("customFields") || c.key.includes("pipelines")).length, 0);
assert.deepEqual(calls.find((c) => c.key === "POST /contacts/c1/tags").body.tags, ["website lead", "estimate request", "deck and fence", "sms consent transactional", "sms consent marketing", "test"]);
r = await run(m, { ...lead, name: "Pat Smith" }, env, "9.9.9.9"); assert.ok(!calls.find((c) => c.key === "POST /contacts/c1/tags").body.tags.includes("test"));
out.push("field and pipeline ids cached; both consent tags; project tag lowercase");

// 3 existing open opportunity -> note instead of a second one
plan["GET /opportunities/search"] = () => Response.json({ opportunities: [{ id: "o9", name: "Old one" }] });
r = await run(m, lead, env, "9.9.9.3");
assert.equal(r.status, 200); assert.ok(!calls.some((c) => c.key === "POST /opportunities/"));
assert.equal(calls.filter((c) => c.key === "POST /contacts/c1/notes").length, 2);
delete plan["GET /opportunities/search"];
out.push("existing open opportunity: no second opportunity, extra note added");

// 4 retry once on 500 then succeed
let k = 0; plan["POST /contacts/upsert"] = () => (k++ === 0 ? new Response("boom", { status: 500 }) : null);
r = await run(m, lead, env, "9.9.9.4"); assert.equal(r.status, 200); assert.equal(calls.filter((c) => c.key === "POST /contacts/upsert").length, 2);
out.push("upsert 500 then ok: retried once, 200");
// 5 two failures -> 502, no third try
plan["POST /contacts/upsert"] = () => new Response("down", { status: 503 });
r = await run(m, lead, env, "9.9.9.5"); assert.equal(r.status, 502); assert.equal(calls.filter((c) => c.key === "POST /contacts/upsert").length, 2);
assert.ok(errors.some((e) => e.includes("estimate gohighlevel failed"))); assert.ok(!errors.join(" ").includes("secret-token-xyz"));
out.push("upsert fails twice: 502 send_failed, logged without the token");
// 6 401 not retried
plan["POST /contacts/upsert"] = () => new Response("bad token", { status: 401 });
r = await run(m, lead, env, "9.9.9.6"); assert.equal(r.status, 502); assert.equal(calls.filter((c) => c.key === "POST /contacts/upsert").length, 1);
out.push("401: not retried, 502");
// 7 custom field rejected -> saved without
let j = 0; plan["POST /contacts/upsert"] = (c) => (c.body.customFields ? new Response("bad field", { status: 422 }) : null);
r = await run(m, lead, env, "9.9.9.7"); assert.equal(r.status, 200);
assert.ok(calls.find((c) => c.key === "POST /contacts/c1/notes").body.body.includes("Custom fields were not saved"));
delete plan["POST /contacts/upsert"];
out.push("custom field value rejected: contact saved without it, note says so");
// 8 opportunity failure still 200
plan["POST /opportunities/"] = () => new Response("x", { status: 400 });
r = await run(m, lead, env, "9.9.9.8"); assert.equal(r.status, 200); delete plan["POST /opportunities/"];
out.push("opportunity create fails: contact exists so 200, error logged");

// 9 validation, bots, rate limit
m = await fresh();
assert.equal((await run(m, { ...lead, elapsed_ms: 1200 }, env, "8.8.8.1")).json.error, "too_fast");
assert.equal((await run(m, { ...lead, elapsed_ms: undefined }, env, "8.8.8.1")).json.error, "too_fast");
assert.equal(calls.length, 0);
r = await run(m, { ...lead, company: "spam" }, env, "8.8.8.2"); assert.equal(r.status, 200); assert.equal(calls.length, 0);
r = await run(m, { ...lead, phone: "555 0100" }, env, "8.8.8.3"); assert.deepEqual(r.json.fields, ["phone"]);
r = await run(m, { ...lead, phone: "+1 615 555 0100" }, env, "8.8.8.4"); assert.equal(calls.find((c) => c.key === "POST /contacts/upsert").body.phone, "+16155550100");
const statuses = []; for (let i = 0; i < 7; i++) statuses.push((await run(m, lead, env, "7.7.7.7")).status);
assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429, 429]);
assert.equal((await run(m, lead, env, "7.7.7.8")).status, 200);
out.push("too fast and missing timer: 400; honeypot: silent 200 with no calls; bad phone 400; +1 normalized; 6th request in 10 minutes from one IP: 429");

// 10 not configured -> 503, backup email when Resend set
r = await run(m, lead, {}, "6.6.6.1"); assert.equal(r.status, 503); assert.equal(calls.length, 0);
r = await run(m, lead, { RESEND_API_KEY: "re_x" }, "6.6.6.2"); assert.equal(r.status, 503);
const em = calls.find((c) => c.url.includes("resend")); assert.deepEqual(em.body.to, ["completedeckandfence@gmail.com"]); assert.ok(em.body.text.includes("Text box 1 checked"));
r = await run(m, lead, { ...env, RESEND_API_KEY: "re_x" }, "6.6.6.3"); assert.equal(r.status, 200); assert.ok(calls.some((c) => c.url.includes("resend")));
out.push("no token: 503; backup email to completedeckandfence@gmail.com when RESEND_API_KEY is set, alongside GoHighLevel");
// 11 pipeline missing
m = await fresh(); plan["GET /opportunities/pipelines"] = () => Response.json({ pipelines: [{ id: "p0", name: "Other", stages: [] }] });
r = await run(m, lead, env, "5.5.5.1"); assert.equal(r.status, 200); assert.ok(errors.some((e) => e.includes('no pipeline named "Deck & Fence Jobs"')));
out.push("pipeline missing: contact still saved, clear error logged");
// 12 Project Timeline field and dropdown options
const fieldsSeen = (cs) => calls.find((c) => c.key === "POST /contacts/upsert").body.customFields;
plan["GET /opportunities/pipelines"] = null; delete plan["GET /opportunities/pipelines"];
plan["GET /locations/loc1/customFields"] = () => Response.json({ customFields: [{ id: "f_old", name: "Timeline" }, { id: "f_proj", name: "Project Type" }, { id: "f_ptl", name: "Project Timeline" }] });
m = await fresh();
const cases = [
  ["Deck and fence", "Next 1 to 3 months", "Deck and fence together", "Within 3 months"],
  ["Deck", "As soon as possible", "Deck", "As soon as possible"],
  ["Fence", "Just planning", "Fence", "Just planning"],
  ["Repair", "Next 1 to 3 months", "Repair", "Within 3 months"],
];
let ipn = 0;
for (const [project, timeline, wantP, wantT] of cases) {
  r = await run(m, { ...lead, name: "Pat Smith", project, timeline }, env, `4.4.4.${ipn++}`);
  assert.equal(r.status, 200);
  assert.deepEqual(fieldsSeen(), [{ id: "f_proj", field_value: wantP }, { id: "f_ptl", field_value: wantT }]);
  const nb = calls.find((c) => c.key === "POST /contacts/c1/notes").body.body;
  assert.ok(nb.includes(`Project: ${project}`) && nb.includes(`When to start: ${timeline}`), "note keeps raw answers");
  assert.ok(calls.find((c) => c.key === "POST /contacts/c1/tags").body.tags.includes(project.toLowerCase()), "tag keeps raw answer");
}
out.push("Project Timeline is chosen over Timeline; Deck and fence becomes Deck and fence together, Next 1 to 3 months becomes Within 3 months, others unchanged; note and tags keep the raw answers");
// only a field named Timeline exists: still used
plan["GET /locations/loc1/customFields"] = () => Response.json({ customFields: [{ id: "f_old", name: "Timeline" }, { id: "f_proj", name: "project type" }] });
m = await fresh();
r = await run(m, { ...lead, timeline: "Next 1 to 3 months" }, env, "4.4.5.1");
assert.deepEqual(fieldsSeen(), [{ id: "f_proj", field_value: "Fence" }, { id: "f_old", field_value: "Within 3 months" }]);
// no timeline answered: field left out
r = await run(m, { ...lead, timeline: "" }, env, "4.4.5.2");
assert.deepEqual(fieldsSeen(), [{ id: "f_proj", field_value: "Fence" }]);
delete plan["GET /locations/loc1/customFields"];
out.push("falls back to a field named Timeline; no timeline answer sends no timeline field");
console.log(out.map((s) => "PASS " + s).join("\n"));
