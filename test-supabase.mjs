// Supabase owner-scoping smoke test.
// Run: node test-supabase.mjs
// Verifies that fh_inspections and fh_partner_jobs accept an `owner` column
// and that .eq("owner", x) isolation works before we deploy.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Parse .env manually — no dotenv dependency needed.
const env = Object.fromEntries(
  readFileSync(new URL("./.env", import.meta.url), "utf8")
    .split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => l.split("=").map(s => s.trim()))
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const TEST_OWNER = "__smoke_test__";
let passed = 0;
let failed = 0;

async function check(label, fn) {
  try {
    await fn();
    console.log(`  ✓  ${label}`);
    passed++;
  } catch (e) {
    console.error(`  ✗  ${label}`);
    console.error(`     ${e.message}`);
    failed++;
  }
}

// ── fh_inspections ───────────────────────────────────────────
console.log("\n── fh_inspections ──────────────────────────────────");

let inspId = null;
await check("INSERT with owner column", async () => {
  const { data, error } = await supabase
    .from("fh_inspections")
    .insert({ inspection_data: [], updated_at: new Date().toISOString(), updated_by: TEST_OWNER, owner: TEST_OWNER })
    .select()
    .single();
  if (error) throw new Error(error.message);
  inspId = data.id;
});

await check("SELECT filtered by owner returns own row", async () => {
  const { data, error } = await supabase
    .from("fh_inspections")
    .select("*")
    .eq("owner", TEST_OWNER);
  if (error) throw new Error(error.message);
  if (!data.length) throw new Error("No rows returned for own owner");
});

await check("SELECT with different owner returns nothing (isolation)", async () => {
  const { data, error } = await supabase
    .from("fh_inspections")
    .select("*")
    .eq("owner", "Jesse")
    .eq("id", inspId ?? "no-such-id");
  if (error) throw new Error(error.message);
  if (data.length > 0) throw new Error("Cross-owner data leak detected");
});

await check("UPDATE scoped by owner+id", async () => {
  if (!inspId) throw new Error("No id from INSERT — skipping");
  const { error } = await supabase
    .from("fh_inspections")
    .update({ inspection_data: [{ test: true }], updated_at: new Date().toISOString(), updated_by: TEST_OWNER })
    .eq("id", inspId)
    .eq("owner", TEST_OWNER);
  if (error) throw new Error(error.message);
});

await check("DELETE test row (cleanup)", async () => {
  if (!inspId) throw new Error("No id — skipping cleanup");
  const { error } = await supabase
    .from("fh_inspections")
    .delete()
    .eq("id", inspId)
    .eq("owner", TEST_OWNER);
  if (error) throw new Error(error.message);
});

// ── fh_partner_jobs ──────────────────────────────────────────
console.log("\n── fh_partner_jobs ─────────────────────────────────");

let pjId = null;
await check("INSERT with owner column", async () => {
  const { data, error } = await supabase
    .from("fh_partner_jobs")
    .insert({ job_data: [], updated_at: new Date().toISOString(), updated_by: TEST_OWNER, owner: TEST_OWNER })
    .select()
    .single();
  if (error) throw new Error(error.message);
  pjId = data.id;
});

await check("SELECT filtered by owner returns own row", async () => {
  const { data, error } = await supabase
    .from("fh_partner_jobs")
    .select("*")
    .eq("owner", TEST_OWNER);
  if (error) throw new Error(error.message);
  if (!data.length) throw new Error("No rows returned for own owner");
});

await check("SELECT with different owner returns nothing (isolation)", async () => {
  const { data, error } = await supabase
    .from("fh_partner_jobs")
    .select("*")
    .eq("owner", "Jesse")
    .eq("id", pjId ?? "no-such-id");
  if (error) throw new Error(error.message);
  if (data.length > 0) throw new Error("Cross-owner data leak detected");
});

await check("UPDATE scoped by owner+id", async () => {
  if (!pjId) throw new Error("No id from INSERT — skipping");
  const { error } = await supabase
    .from("fh_partner_jobs")
    .update({ job_data: [{ test: true }], updated_at: new Date().toISOString(), updated_by: TEST_OWNER })
    .eq("id", pjId)
    .eq("owner", TEST_OWNER);
  if (error) throw new Error(error.message);
});

await check("DELETE test row (cleanup)", async () => {
  if (!pjId) throw new Error("No id — skipping cleanup");
  const { error } = await supabase
    .from("fh_partner_jobs")
    .delete()
    .eq("id", pjId)
    .eq("owner", TEST_OWNER);
  if (error) throw new Error(error.message);
});

// ── Summary ──────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`  ${passed} passed  ${failed} failed`);
if (failed > 0) { console.error("\nSome tests failed — check error messages above."); process.exit(1); }
else { console.log("\nAll Supabase owner-scoping checks passed.\n"); }
