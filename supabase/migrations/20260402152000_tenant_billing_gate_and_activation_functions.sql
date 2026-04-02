-- Tenant billing gate + activation helpers
-- Created: 2026-04-02

create or replace function public.get_current_club_admin_activation_state()
returns table (
  tenant_id uuid,
  lifecycle_status text,
  billing_status text,
  billing_provider text,
  billing_contact_name text,
  billing_contact_email text,
  billing_cycle text,
  onboarding_step text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'No authenticated user';
  end if;

  return query
  select
    p.tenant_id,
    tpr.lifecycle_status,
    tpr.billing_status,
    tpr.billing_provider,
    tpr.billing_contact_name,
    tpr.billing_contact_email,
    tpr.billing_cycle,
    t.onboarding_step
  from public.profiles p
  join public.tenants t
    on t.id = p.tenant_id
  left join public.tenant_provision_requests tpr
    on tpr.provisioned_tenant_id = p.tenant_id
  where p.user_id = v_user_id
    and p.role = 'club-admin'
  order by tpr.created_at desc nulls last
  limit 1;
end;
$$;

grant execute on function public.get_current_club_admin_activation_state() to authenticated;

create or replace function public.complete_current_club_admin_mock_billing_setup(
  p_billing_contact_name text,
  p_billing_contact_email text,
  p_billing_cycle text default 'monthly'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_request public.tenant_provision_requests%rowtype;
begin
  if v_user_id is null then
    raise exception 'No authenticated user';
  end if;

  if p_billing_contact_name is null or btrim(p_billing_contact_name) = '' then
    raise exception 'Billing contact name is required';
  end if;

  if p_billing_contact_email is null or btrim(p_billing_contact_email) = '' then
    raise exception 'Billing contact email is required';
  end if;

  if p_billing_cycle not in ('monthly', 'annual') then
    raise exception 'Billing cycle must be monthly or annual';
  end if;

  select *
  into v_profile
  from public.profiles
  where user_id = v_user_id
    and role = 'club-admin'
  limit 1;

  if not found then
    raise exception 'Only club-admin users can complete billing setup';
  end if;

  select *
  into v_request
  from public.tenant_provision_requests
  where provisioned_tenant_id = v_profile.tenant_id
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'No tenant request found for current tenant';
  end if;

  if v_request.lifecycle_status <> 'approved_pending_billing' then
    raise exception 'Billing setup is only available for approved tenants awaiting billing';
  end if;

  update public.tenant_provision_requests
  set
    billing_contact_name = btrim(p_billing_contact_name),
    billing_contact_email = lower(btrim(p_billing_contact_email)),
    billing_cycle = p_billing_cycle,
    billing_status = 'mocked_complete',
    billing_started_at = coalesce(billing_started_at, now()),
    lifecycle_status = 'active_onboarding'
  where id = v_request.id;

  update public.tenants
  set onboarding_step = coalesce(onboarding_step, 'club_profile')
  where id = v_profile.tenant_id;

  perform public.insert_platform_audit_event(
    v_user_id,
    lower(btrim(p_billing_contact_email)),
    'club-admin',
    'tenant_mock_billing_completed',
    v_request.organization_name,
    format('Mock billing setup completed for tenant %s on %s cycle', v_profile.tenant_id::text, p_billing_cycle),
    jsonb_build_object(
      'tenant_id', v_profile.tenant_id::text,
      'tenant_provision_request_id', v_request.id::text,
      'billing_cycle', p_billing_cycle,
      'billing_status', 'mocked_complete'
    )
  );

  return v_profile.tenant_id;
end;
$$;

grant execute on function public.complete_current_club_admin_mock_billing_setup(text, text, text) to authenticated;

create or replace function public.review_tenant_provision_request(
  p_request_id uuid,
  p_status text,
  p_review_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.tenant_provision_requests%rowtype;
  v_subject text;
  v_body text;
begin
  if not public.is_platform_admin() then
    raise exception 'Only platform-admin users can review tenant provision requests';
  end if;

  if p_status not in ('approved', 'rejected') then
    raise exception 'Review status must be approved or rejected';
  end if;

  select *
  into v_request
  from public.tenant_provision_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Tenant provision request not found';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Only pending requests can be reviewed';
  end if;

  update public.tenant_provision_requests
  set status = p_status,
      lifecycle_status = case
        when p_status = 'approved' then 'approved_pending_billing'
        else 'cancelled'
      end,
      billing_status = case
        when p_status = 'approved' then coalesce(billing_status, 'pending')
        else 'cancelled'
      end,
      reviewed_by_user_id = auth.uid(),
      review_notes = nullif(btrim(coalesce(p_review_notes, '')), ''),
      reviewed_at = now()
  where id = p_request_id;

  v_subject := case
    when p_status = 'approved' then 'Tenant request approved'
    else 'Tenant request rejected'
  end;

  v_body := case
    when p_status = 'approved' then format(
      'Your request for %s has been approved. Billing setup is the next step before workspace activation.',
      v_request.organization_name
    )
    else format(
      'Your request for %s has been rejected. %s',
      v_request.organization_name,
      coalesce(nullif(btrim(coalesce(p_review_notes, '')), ''), 'No review note was provided.')
    )
  end;

  insert into public.notification_events (
    tenant_id,
    recipient_user_id,
    recipient_email,
    channel,
    event_type,
    subject,
    body,
    status,
    metadata
  )
  values (
    null,
    v_request.submitted_by_user_id,
    v_request.requestor_email,
    'email',
    'tenant_provision_request_reviewed',
    v_subject,
    v_body,
    'pending',
    jsonb_build_object(
      'tenant_provision_request_id', v_request.id::text,
      'status', p_status,
      'lifecycle_status', case when p_status = 'approved' then 'approved_pending_billing' else 'cancelled' end
    )
  );

  if v_request.submitted_by_user_id is not null then
    insert into public.notification_events (
      tenant_id,
      recipient_user_id,
      recipient_email,
      channel,
      event_type,
      subject,
      body,
      status,
      metadata
    )
    values (
      null,
      v_request.submitted_by_user_id,
      v_request.requestor_email,
      'in-app',
      'tenant_provision_request_reviewed',
      v_subject,
      v_body,
      'pending',
      jsonb_build_object(
        'tenant_provision_request_id', v_request.id::text,
        'status', p_status,
        'lifecycle_status', case when p_status = 'approved' then 'approved_pending_billing' else 'cancelled' end
      )
    );
  end if;
end;
$$;

grant execute on function public.review_tenant_provision_request(uuid, text, text) to authenticated;

create or replace function public.approve_and_provision_tenant_request(
  p_request_id uuid,
  p_review_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.tenant_provision_requests%rowtype;
  v_tenant_id uuid;
  v_slug text;
begin
  if not public.is_platform_admin() then
    raise exception 'Only platform-admin users can provision tenant requests';
  end if;

  select *
  into v_request
  from public.tenant_provision_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Tenant provision request not found';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Only pending requests can be provisioned';
  end if;

  if v_request.provisioned_tenant_id is not null then
    return v_request.provisioned_tenant_id;
  end if;

  perform public.review_tenant_provision_request(
    p_request_id,
    'approved',
    p_review_notes
  );

  v_slug := regexp_replace(lower(v_request.organization_name), '[^a-z0-9]+', '-', 'g');
  v_slug := regexp_replace(v_slug, '(^-+|-+$)', '', 'g');
  if v_slug = '' then
    v_slug := 'tenant';
  end if;

  while exists (select 1 from public.tenants where slug = v_slug) loop
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 6);
  end loop;

  insert into public.tenants (slug, name, is_active, onboarding_step)
  values (v_slug, v_request.organization_name, true, 'club_profile')
  returning id into v_tenant_id;

  update public.tenant_provision_requests
  set
    provisioned_tenant_id = v_tenant_id,
    lifecycle_status = 'approved_pending_billing',
    billing_status = coalesce(billing_status, 'pending')
  where id = p_request_id;

  perform public.insert_platform_audit_event(
    auth.uid(),
    lower(coalesce(auth.jwt() ->> 'email', v_request.requestor_email)),
    'platform-admin',
    'tenant_provision_request_provisioned',
    v_request.organization_name,
    format('Tenant %s provisioned and is awaiting billing setup before activation', v_tenant_id::text),
    jsonb_build_object(
      'tenant_id', v_tenant_id::text,
      'tenant_provision_request_id', v_request.id::text,
      'lifecycle_status', 'approved_pending_billing',
      'billing_status', 'pending'
    )
  );

  return v_tenant_id;
end;
$$;

grant execute on function public.approve_and_provision_tenant_request(uuid, text) to authenticated;
