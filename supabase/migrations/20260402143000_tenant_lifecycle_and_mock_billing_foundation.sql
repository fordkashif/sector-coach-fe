-- Tenant lifecycle + mocked billing foundation
-- Created: 2026-04-02

alter table public.tenant_provision_requests
  add column if not exists lifecycle_status text,
  add column if not exists billing_status text,
  add column if not exists billing_provider text,
  add column if not exists billing_customer_id text,
  add column if not exists billing_subscription_id text,
  add column if not exists billing_contact_name text,
  add column if not exists billing_contact_email text,
  add column if not exists billing_cycle text,
  add column if not exists billing_started_at timestamptz,
  add column if not exists billing_failed_at timestamptz;

alter table public.tenant_provision_requests
  drop constraint if exists tenant_provision_requests_lifecycle_status_check;
alter table public.tenant_provision_requests
  add constraint tenant_provision_requests_lifecycle_status_check
  check (
    lifecycle_status is null
    or lifecycle_status in (
      'pending_review',
      'approved_pending_billing',
      'billing_failed',
      'active_onboarding',
      'active',
      'suspended',
      'cancelled'
    )
  );

alter table public.tenant_provision_requests
  drop constraint if exists tenant_provision_requests_billing_status_check;
alter table public.tenant_provision_requests
  add constraint tenant_provision_requests_billing_status_check
  check (
    billing_status is null
    or billing_status in ('pending', 'mocked_complete', 'failed', 'active', 'past_due', 'cancelled')
  );

alter table public.tenant_provision_requests
  drop constraint if exists tenant_provision_requests_billing_cycle_check;
alter table public.tenant_provision_requests
  add constraint tenant_provision_requests_billing_cycle_check
  check (
    billing_cycle is null
    or billing_cycle in ('monthly', 'annual')
  );

update public.tenant_provision_requests
set
  lifecycle_status = case
    when provisioned_tenant_id is not null then 'active_onboarding'
    when status = 'pending' then 'pending_review'
    when status = 'approved' then 'approved_pending_billing'
    when status = 'rejected' then 'cancelled'
    when status = 'cancelled' then 'cancelled'
    else coalesce(lifecycle_status, 'pending_review')
  end,
  billing_status = case
    when provisioned_tenant_id is not null then 'mocked_complete'
    when status = 'approved' then 'pending'
    when status in ('rejected', 'cancelled') then 'cancelled'
    else coalesce(billing_status, 'pending')
  end,
  billing_provider = coalesce(billing_provider, 'mock-billing'),
  billing_contact_name = coalesce(billing_contact_name, requestor_name),
  billing_contact_email = coalesce(billing_contact_email, requestor_email),
  billing_cycle = coalesce(billing_cycle, 'monthly');

alter table public.tenant_provision_requests
  alter column lifecycle_status set default 'pending_review';
alter table public.tenant_provision_requests
  alter column billing_status set default 'pending';
alter table public.tenant_provision_requests
  alter column billing_provider set default 'mock-billing';
alter table public.tenant_provision_requests
  alter column billing_cycle set default 'monthly';

create index if not exists tenant_provision_requests_lifecycle_status_created_idx
on public.tenant_provision_requests (lifecycle_status, created_at desc);

alter table public.tenants
  add column if not exists onboarding_step text,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists branding_completed_at timestamptz,
  add column if not exists workspace_config_completed_at timestamptz,
  add column if not exists first_team_completed_at timestamptz,
  add column if not exists coach_access_completed_at timestamptz;

alter table public.tenants
  drop constraint if exists tenants_onboarding_step_check;
alter table public.tenants
  add constraint tenants_onboarding_step_check
  check (
    onboarding_step is null
    or onboarding_step in ('club_profile', 'branding', 'first_team', 'coach_access', 'review', 'complete')
  );

update public.tenants
set onboarding_step = coalesce(onboarding_step, case when is_active then 'club_profile' else null end);
