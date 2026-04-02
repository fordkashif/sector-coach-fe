alter table public.tenant_provision_requests
  add column if not exists previous_lifecycle_status text;

alter table public.tenant_provision_requests
  drop constraint if exists tenant_provision_requests_previous_lifecycle_status_check;

alter table public.tenant_provision_requests
  add constraint tenant_provision_requests_previous_lifecycle_status_check
  check (
    previous_lifecycle_status is null
    or previous_lifecycle_status in (
      'pending_review',
      'approved_pending_billing',
      'billing_failed',
      'active_onboarding',
      'active',
      'suspended',
      'cancelled'
    )
  );
