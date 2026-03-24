-- Allow approved requestors to read their own provisioned tenant request
-- Created: 2026-03-24

drop policy if exists tenant_provision_requests_requestor_bootstrap_select on public.tenant_provision_requests;
create policy tenant_provision_requests_requestor_bootstrap_select
on public.tenant_provision_requests
for select
to authenticated
using (
  lower(requestor_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  and status = 'approved'
  and provisioned_tenant_id is not null
);
