-- ==========================================================================
-- Fieldhorse — Multi-tenant migration (2026-04-16)
-- ==========================================================================
-- Converts the legacy single-org / owner-string data model into true
-- multi-tenant isolation keyed on `org_id`, wired to Supabase Auth.
--
-- Safe to re-run: every statement uses IF NOT EXISTS / IF EXISTS guards.
--
-- APPLIES TO (existing tables):
--   - fh_users           (pin-based, adds auth_user_id + org_id + email + reset flag)
--   - fh_partner_jobs    (adds org_id FK + RLS)
--   - fh_inspections     (adds org_id FK + RLS)
--
-- CREATES:
--   - fh_organizations   (the tenant root)
--
-- The legacy `owner` column is RETAINED on fh_partner_jobs / fh_inspections
-- for the data migration script to reference — it can be dropped in a
-- follow-up migration once all rows have been rekeyed to org_id.
-- ==========================================================================

-- ─── EXTENSIONS ─────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── 1. fh_organizations ────────────────────────────────────────────────
create table if not exists public.fh_organizations (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  services          text[] not null default '{}',
  subscription_tier text not null default 'solo',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists fh_organizations_name_idx on public.fh_organizations (name);

-- ─── 2. fh_users — extend for auth linkage ──────────────────────────────
-- (Table already exists from PIN-era. We add what's missing; old columns
--  like `pin` stay until a later cleanup migration.)
alter table public.fh_users
  add column if not exists auth_user_id         uuid unique,
  add column if not exists org_id               uuid references public.fh_organizations(id) on delete cascade,
  add column if not exists email                text,
  add column if not exists must_reset_password  boolean not null default false,
  add column if not exists created_at           timestamptz not null default now(),
  add column if not exists updated_at           timestamptz not null default now();

-- unique email across the platform (nullable so legacy rows without email remain valid)
create unique index if not exists fh_users_email_unique
  on public.fh_users (lower(email))
  where email is not null;

create index if not exists fh_users_auth_user_id_idx on public.fh_users (auth_user_id);
create index if not exists fh_users_org_id_idx       on public.fh_users (org_id);

-- ─── 3. fh_partner_jobs — add org_id ────────────────────────────────────
alter table public.fh_partner_jobs
  add column if not exists org_id uuid references public.fh_organizations(id) on delete cascade;

create index if not exists fh_partner_jobs_org_id_idx on public.fh_partner_jobs (org_id);

-- ─── 4. fh_inspections — add org_id ─────────────────────────────────────
alter table public.fh_inspections
  add column if not exists org_id uuid references public.fh_organizations(id) on delete cascade;

create index if not exists fh_inspections_org_id_idx on public.fh_inspections (org_id);

-- ==========================================================================
-- ROW-LEVEL SECURITY
-- ==========================================================================
-- Strategy: each data table enables RLS and allows a row if and only if
-- its org_id matches the caller's org_id, looked up via fh_users.auth_user_id
-- = auth.uid().  The helper function caches the lookup per-statement.
-- ==========================================================================

create or replace function public.fh_current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id
    from public.fh_users
   where auth_user_id = auth.uid()
   limit 1
$$;

grant execute on function public.fh_current_org_id() to authenticated, anon;

-- ─── fh_organizations RLS ───────────────────────────────────────────────
alter table public.fh_organizations enable row level security;

drop policy if exists "org_select_own" on public.fh_organizations;
create policy "org_select_own"
  on public.fh_organizations
  for select
  to authenticated
  using (id = public.fh_current_org_id());

drop policy if exists "org_update_own" on public.fh_organizations;
create policy "org_update_own"
  on public.fh_organizations
  for update
  to authenticated
  using (id = public.fh_current_org_id())
  with check (id = public.fh_current_org_id());

-- INSERT is allowed for any authenticated user — a fresh signup inserts
-- its own org row, then immediately links itself to it in fh_users.
drop policy if exists "org_insert_any" on public.fh_organizations;
create policy "org_insert_any"
  on public.fh_organizations
  for insert
  to authenticated
  with check (true);

-- ─── fh_users RLS ───────────────────────────────────────────────────────
alter table public.fh_users enable row level security;

drop policy if exists "users_select_same_org" on public.fh_users;
create policy "users_select_same_org"
  on public.fh_users
  for select
  to authenticated
  using (org_id = public.fh_current_org_id() or auth_user_id = auth.uid());

drop policy if exists "users_update_self" on public.fh_users;
create policy "users_update_self"
  on public.fh_users
  for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

drop policy if exists "users_insert_self" on public.fh_users;
create policy "users_insert_self"
  on public.fh_users
  for insert
  to authenticated
  with check (auth_user_id = auth.uid());

-- ─── fh_partner_jobs RLS ────────────────────────────────────────────────
alter table public.fh_partner_jobs enable row level security;

drop policy if exists "partner_jobs_org_all" on public.fh_partner_jobs;
create policy "partner_jobs_org_all"
  on public.fh_partner_jobs
  for all
  to authenticated
  using (org_id = public.fh_current_org_id())
  with check (org_id = public.fh_current_org_id());

-- ─── fh_inspections RLS ─────────────────────────────────────────────────
alter table public.fh_inspections enable row level security;

drop policy if exists "inspections_org_all" on public.fh_inspections;
create policy "inspections_org_all"
  on public.fh_inspections
  for all
  to authenticated
  using (org_id = public.fh_current_org_id())
  with check (org_id = public.fh_current_org_id());

-- ==========================================================================
-- TRIGGERS — keep updated_at fresh
-- ==========================================================================
create or replace function public.fh_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists fh_organizations_updated_at on public.fh_organizations;
create trigger fh_organizations_updated_at
  before update on public.fh_organizations
  for each row execute function public.fh_set_updated_at();

drop trigger if exists fh_users_updated_at on public.fh_users;
create trigger fh_users_updated_at
  before update on public.fh_users
  for each row execute function public.fh_set_updated_at();

-- ==========================================================================
-- DONE.
-- ==========================================================================
