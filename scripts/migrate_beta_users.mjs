#!/usr/bin/env node
// ========================================================================
// Fieldhorse — Beta user migration
// ========================================================================
// Reads beta_users.json at the repo root and, for each user:
//   1. Creates an fh_organizations row
//   2. Creates a Supabase Auth user with a random 12-char temp password
//      (email_confirm: true so they can sign in immediately)
//   3. Upserts fh_users with auth_user_id + org_id + must_reset_password
//   4. If preserve_data: true, re-keys existing rows in fh_partner_jobs
//      and fh_inspections from owner=<name> to the new org_id.
//
// ENV:
//   SUPABASE_URL                (defaults to VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY   (REQUIRED — never commit this)
//
// USAGE:
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/migrate_beta_users.mjs
// ========================================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

// ─── ENV ───────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('✗ SUPABASE_URL (or VITE_SUPABASE_URL) is not set.');
  process.exit(1);
}
if (!SERVICE_KEY) {
  console.error('✗ SUPABASE_SERVICE_ROLE_KEY is not set.');
  console.error('  Get it from: Supabase dashboard → Project Settings → API → service_role key');
  console.error('  Then run: SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/migrate_beta_users.mjs');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── HELPERS ───────────────────────────────────────────────────────────
const TEMP_PW_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
function genTempPassword(len = 12) {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += TEMP_PW_CHARS[Math.floor(Math.random() * TEMP_PW_CHARS.length)];
  }
  return out;
}

function log(...args)  { console.log('  ', ...args); }
function step(msg)     { console.log('\n▸', msg); }
function ok(msg)       { console.log('  ✓', msg); }
function warn(msg)     { console.log('  ⚠', msg); }
function fail(msg)     { console.log('  ✗', msg); }

// ─── READ SEED DATA ────────────────────────────────────────────────────
const usersPath = resolve(REPO_ROOT, 'beta_users.json');
const users = JSON.parse(readFileSync(usersPath, 'utf8'));
console.log(`\n=== Fieldhorse beta user migration ===`);
console.log(`Reading ${users.length} users from beta_users.json\n`);

// ─── MIGRATION ─────────────────────────────────────────────────────────
const results = [];

for (const u of users) {
  step(`${u.name} <${u.email}>  [${u.org_name}]`);

  // 1. fh_organizations row (find-or-create on name)
  let orgId = null;
  {
    const { data: existing, error: selErr } = await admin
      .from('fh_organizations')
      .select('id')
      .eq('name', u.org_name)
      .maybeSingle();
    if (selErr && selErr.code !== 'PGRST116') {
      fail(`org lookup failed: ${selErr.message}`);
      results.push({ user: u.name, status: 'ERROR', detail: selErr.message });
      continue;
    }
    if (existing?.id) {
      orgId = existing.id;
      ok(`org exists → ${orgId}`);
    } else {
      const { data: created, error: insErr } = await admin
        .from('fh_organizations')
        .insert({
          name: u.org_name,
          services: u.services || [],
          subscription_tier: 'solo',
        })
        .select('id')
        .single();
      if (insErr) {
        fail(`org insert failed: ${insErr.message}`);
        results.push({ user: u.name, status: 'ERROR', detail: insErr.message });
        continue;
      }
      orgId = created.id;
      ok(`org created → ${orgId}`);
    }
  }

  // 2. Supabase Auth user
  const tempPassword = genTempPassword(12);
  let authUserId = null;
  {
    // Try create first; if user already exists, fetch them.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: u.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: u.name, org_name: u.org_name },
    });
    if (createErr) {
      // If already registered, look up existing user and reset their password to the fresh temp.
      const already = /already been registered|already registered|duplicate/i.test(createErr.message);
      if (!already) {
        fail(`auth create failed: ${createErr.message}`);
        results.push({ user: u.name, status: 'ERROR', detail: createErr.message });
        continue;
      }
      warn(`auth user already exists — looking up & resetting password`);
      const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listErr) {
        fail(`listUsers failed: ${listErr.message}`);
        results.push({ user: u.name, status: 'ERROR', detail: listErr.message });
        continue;
      }
      const match = list.users.find(x => (x.email || '').toLowerCase() === u.email.toLowerCase());
      if (!match) {
        fail(`auth user claimed to exist but not found in list`);
        results.push({ user: u.name, status: 'ERROR', detail: 'auth user not found' });
        continue;
      }
      authUserId = match.id;
      const { error: updErr } = await admin.auth.admin.updateUserById(authUserId, {
        password: tempPassword,
        email_confirm: true,
      });
      if (updErr) {
        fail(`auth password reset failed: ${updErr.message}`);
        results.push({ user: u.name, status: 'ERROR', detail: updErr.message });
        continue;
      }
      ok(`auth user reset → ${authUserId}`);
    } else {
      authUserId = created.user.id;
      ok(`auth user created → ${authUserId}`);
    }
  }

  // 3. Upsert fh_users
  {
    // Prefer updating an existing row that matches either auth_user_id or (name, email).
    const { data: existing } = await admin
      .from('fh_users')
      .select('id')
      .or(`auth_user_id.eq.${authUserId},email.eq.${u.email},name.eq.${u.name}`)
      .limit(1)
      .maybeSingle();

    const payload = {
      auth_user_id: authUserId,
      org_id: orgId,
      name: u.name,
      email: u.email,
      company: u.org_name,
      role: u.role || 'owner',
      must_reset_password: true,
    };

    if (existing?.id) {
      const { error: updErr } = await admin
        .from('fh_users')
        .update(payload)
        .eq('id', existing.id);
      if (updErr) {
        fail(`fh_users update failed: ${updErr.message}`);
        results.push({ user: u.name, status: 'ERROR', detail: updErr.message });
        continue;
      }
      ok('fh_users updated');
    } else {
      const { error: insErr } = await admin
        .from('fh_users')
        .insert(payload);
      if (insErr) {
        fail(`fh_users insert failed: ${insErr.message}`);
        results.push({ user: u.name, status: 'ERROR', detail: insErr.message });
        continue;
      }
      ok('fh_users inserted');
    }
  }

  // 4. Data migration (preserve_data only)
  if (u.preserve_data) {
    for (const table of ['fh_partner_jobs', 'fh_inspections']) {
      const { data, error: updErr, count } = await admin
        .from(table)
        .update({ org_id: orgId })
        .eq('owner', u.name)
        .is('org_id', null)
        .select('id', { count: 'exact' });
      if (updErr) {
        warn(`${table}: ${updErr.message}`);
      } else {
        ok(`${table}: rekeyed ${data?.length ?? count ?? 0} rows to org_id`);
      }
    }
  } else {
    log('preserve_data=false — skipping data rekey');
  }

  results.push({
    user: u.name,
    email: u.email,
    org: u.org_name,
    org_id: orgId,
    auth_user_id: authUserId,
    temp_password: tempPassword,
    status: 'OK',
  });
}

// ─── REPORT ────────────────────────────────────────────────────────────
console.log('\n==========================================================');
console.log('  MIGRATION COMPLETE — TEMP PASSWORDS');
console.log('==========================================================\n');

const pad = (s, n) => String(s ?? '').padEnd(n);
console.log(
  pad('NAME', 20) +
  pad('EMAIL', 42) +
  pad('TEMP PASSWORD', 16) +
  'STATUS'
);
console.log('-'.repeat(96));
for (const r of results) {
  console.log(
    pad(r.user, 20) +
    pad(r.email || '', 42) +
    pad(r.temp_password || '—', 16) +
    r.status
  );
}
console.log('\nEach beta user is flagged must_reset_password=true — they\'ll be forced');
console.log('to pick a real password on first sign-in.\n');
