-- PaceLab Club/Admin Ops Foundation (Wave 6)
-- Created: 2026-03-20

create table if not exists public.coach_invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  email text not null,
  team_id uuid references public.teams(id) on delete set null,
  role text not null check (role in ('coach', 'club-admin')) default 'coach',
  status text not null check (status in ('pending', 'accepted', 'expired', 'revoked')) default 'pending',
  invited_by_user_id uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  accepted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  full_name text not null,
  email text not null,
  organization text,
  desired_role text not null check (desired_role in ('coach', 'club-admin', 'athlete')),
  notes text,
  status text not null check (status in ('pending', 'approved', 'declined')) default 'pending',
  requested_by_user_id uuid references auth.users(id) on delete set null,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,
  target text not null,
  detail text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists coach_invites_tenant_status_idx
on public.coach_invites (tenant_id, status, created_at desc);

create index if not exists coach_invites_tenant_email_idx
on public.coach_invites (tenant_id, email);

create index if not exists account_requests_tenant_status_idx
on public.account_requests (tenant_id, status, created_at desc);

create index if not exists audit_events_tenant_occured_idx
on public.audit_events (tenant_id, occurred_at desc);

drop trigger if exists set_updated_at_coach_invites on public.coach_invites;
create trigger set_updated_at_coach_invites
before update on public.coach_invites
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_account_requests on public.account_requests;
create trigger set_updated_at_account_requests
before update on public.account_requests
for each row
execute function public.set_updated_at();

alter table public.coach_invites enable row level security;
alter table public.account_requests enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists coach_invites_staff_all on public.coach_invites;
create policy coach_invites_staff_all
on public.coach_invites
for all
to authenticated
using (public.is_club_admin() and tenant_id = public.current_tenant_id())
with check (public.is_club_admin() and tenant_id = public.current_tenant_id());

drop policy if exists account_requests_staff_all on public.account_requests;
create policy account_requests_staff_all
on public.account_requests
for all
to authenticated
using (public.is_club_admin() and tenant_id = public.current_tenant_id())
with check (public.is_club_admin() and tenant_id = public.current_tenant_id());

drop policy if exists account_requests_insert_authenticated on public.account_requests;
create policy account_requests_insert_authenticated
on public.account_requests
for insert
to authenticated
with check (tenant_id = public.current_tenant_id());

drop policy if exists audit_events_select_staff on public.audit_events;
create policy audit_events_select_staff
on public.audit_events
for select
to authenticated
using (public.is_coach_or_admin() and tenant_id = public.current_tenant_id());

drop policy if exists audit_events_insert_tenant on public.audit_events;
create policy audit_events_insert_tenant
on public.audit_events
for insert
to authenticated
with check (tenant_id = public.current_tenant_id());
