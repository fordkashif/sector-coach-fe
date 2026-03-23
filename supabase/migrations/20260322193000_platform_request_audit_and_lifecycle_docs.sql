-- Created: 2026-03-22

create table if not exists public.platform_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  actor_role text not null,
  action text not null,
  target text not null,
  detail text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists platform_audit_events_occurred_idx
on public.platform_audit_events (occurred_at desc);

create index if not exists platform_audit_events_action_idx
on public.platform_audit_events (action, occurred_at desc);

alter table public.platform_audit_events enable row level security;

drop policy if exists platform_audit_events_select_platform_admin on public.platform_audit_events;
create policy platform_audit_events_select_platform_admin
on public.platform_audit_events
for select
to authenticated
using (public.is_platform_admin());

create or replace function public.insert_platform_audit_event(
  p_actor_user_id uuid,
  p_actor_email text,
  p_actor_role text,
  p_action text,
  p_target text,
  p_detail text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.platform_audit_events (
    actor_user_id,
    actor_email,
    actor_role,
    action,
    target,
    detail,
    metadata
  )
  values (
    p_actor_user_id,
    lower(nullif(btrim(coalesce(p_actor_email, '')), '')),
    coalesce(nullif(btrim(coalesce(p_actor_role, '')), ''), 'system'),
    p_action,
    p_target,
    nullif(btrim(coalesce(p_detail, '')), ''),
    coalesce(p_metadata, '{}'::jsonb)
  );
$$;

create or replace function public.submit_tenant_provision_request(
  p_requestor_name text,
  p_requestor_email text,
  p_organization_name text,
  p_notes text default null,
  p_requested_plan text default 'starter',
  p_expected_seats int default 25
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_subject text;
  v_body text;
  v_actor_email text;
begin
  if p_requestor_name is null or btrim(p_requestor_name) = '' then
    raise exception 'Requestor name is required';
  end if;

  if p_requestor_email is null or btrim(p_requestor_email) = '' then
    raise exception 'Requestor email is required';
  end if;

  if p_organization_name is null or btrim(p_organization_name) = '' then
    raise exception 'Organization name is required';
  end if;

  if p_requested_plan not in ('starter', 'pro', 'enterprise') then
    raise exception 'Invalid requested plan';
  end if;

  if p_expected_seats is null or p_expected_seats <= 0 then
    raise exception 'Expected seats must be greater than zero';
  end if;

  if exists (
    select 1
    from public.tenant_provision_requests r
    where lower(r.organization_name) = lower(btrim(p_organization_name))
      and lower(r.requestor_email) = lower(btrim(p_requestor_email))
      and r.status = 'pending'
  ) then
    raise exception 'A pending request already exists for this organization and email';
  end if;

  insert into public.tenant_provision_requests (
    organization_name,
    requestor_name,
    requestor_email,
    requested_plan,
    expected_seats,
    notes,
    status,
    submitted_by_user_id
  )
  values (
    btrim(p_organization_name),
    btrim(p_requestor_name),
    lower(btrim(p_requestor_email)),
    p_requested_plan,
    p_expected_seats,
    nullif(btrim(coalesce(p_notes, '')), ''),
    'pending',
    auth.uid()
  )
  returning id into v_request_id;

  v_subject := 'New tenant provisioning request';
  v_body := format(
    'Organization: %s | Requestor: %s | Email: %s | Plan: %s | Seats: %s',
    btrim(p_organization_name),
    btrim(p_requestor_name),
    lower(btrim(p_requestor_email)),
    p_requested_plan,
    p_expected_seats
  );

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
  select
    null,
    c.user_id,
    c.email,
    'email',
    'tenant_provision_request_submitted',
    v_subject,
    v_body,
    'pending',
    jsonb_build_object('tenant_provision_request_id', v_request_id::text)
  from public.platform_admin_contacts c
  where c.is_active = true;

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
  select
    null,
    c.user_id,
    c.email,
    'in-app',
    'tenant_provision_request_submitted',
    v_subject,
    v_body,
    'pending',
    jsonb_build_object('tenant_provision_request_id', v_request_id::text)
  from public.platform_admin_contacts c
  where c.is_active = true
    and c.user_id is not null;

  select lower(coalesce(auth.jwt() ->> 'email', lower(btrim(p_requestor_email))))
  into v_actor_email;

  perform public.insert_platform_audit_event(
    auth.uid(),
    v_actor_email,
    case when auth.uid() is null then 'anonymous-requestor' else 'requestor' end,
    'tenant_provision_request_submitted',
    lower(btrim(p_requestor_email)),
    format('Organization %s requested on plan %s for %s seats', btrim(p_organization_name), p_requested_plan, p_expected_seats),
    jsonb_build_object(
      'tenant_provision_request_id', v_request_id::text,
      'organization_name', btrim(p_organization_name),
      'requested_plan', p_requested_plan,
      'expected_seats', p_expected_seats,
      'status', 'pending'
    )
  );

  return v_request_id;
end;
$$;

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
      'Your request for %s has been approved. Provisioning is the next step.',
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
      'status', p_status
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
        'status', p_status
      )
    );
  end if;

  perform public.insert_platform_audit_event(
    auth.uid(),
    auth.jwt() ->> 'email',
    'platform-admin',
    'tenant_provision_request_reviewed',
    v_request.requestor_email,
    format('Request for %s moved from pending to %s', v_request.organization_name, p_status),
    jsonb_build_object(
      'tenant_provision_request_id', v_request.id::text,
      'organization_name', v_request.organization_name,
      'from_status', 'pending',
      'to_status', p_status,
      'review_notes', nullif(btrim(coalesce(p_review_notes, '')), '')
    )
  );
end;
$$;

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
  v_base_slug text;
  v_slug text;
  v_tenant_id uuid;
  v_short_name text;
  v_season_year text;
  v_season_start date;
  v_season_end date;
  v_subject text;
  v_body text;
  v_original_status text;
begin
  if not public.is_platform_admin() then
    raise exception 'Only platform-admin users can approve and provision tenant requests';
  end if;

  select *
  into v_request
  from public.tenant_provision_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Tenant provision request not found';
  end if;

  if v_request.status not in ('pending', 'approved') then
    raise exception 'Only pending or approved requests can be provisioned';
  end if;

  if v_request.provisioned_tenant_id is not null then
    return v_request.provisioned_tenant_id;
  end if;

  v_original_status := v_request.status;
  v_base_slug := lower(regexp_replace(btrim(v_request.organization_name), '[^a-z0-9]+', '-', 'g'));
  v_base_slug := trim(both '-' from v_base_slug);
  if v_base_slug = '' then
    v_base_slug := 'club';
  end if;

  v_slug := v_base_slug;
  if exists (select 1 from public.tenants t where t.slug = v_slug) then
    v_slug := v_base_slug || '-' || substring(replace(v_request.id::text, '-', ''), 1, 6);
  end if;

  v_short_name := upper(left(regexp_replace(btrim(v_request.organization_name), '[^A-Za-z0-9]+', '', 'g'), 10));
  if v_short_name = '' then
    v_short_name := 'CLUB';
  end if;

  v_season_year := extract(year from now())::text;
  v_season_start := make_date(extract(year from now())::int, 1, 15);
  v_season_end := make_date(extract(year from now())::int, 10, 31);

  insert into public.tenants (slug, name, is_active)
  values (v_slug, btrim(v_request.organization_name), true)
  returning id into v_tenant_id;

  insert into public.club_profiles (
    tenant_id,
    club_name,
    short_name,
    primary_color,
    season_year,
    season_start,
    season_end
  )
  values (
    v_tenant_id,
    btrim(v_request.organization_name),
    v_short_name,
    '#1368ff',
    v_season_year,
    v_season_start,
    v_season_end
  );

  insert into public.billing_profiles (
    tenant_id,
    plan,
    seats,
    renewal_date,
    payment_method_last4
  )
  values (
    v_tenant_id,
    v_request.requested_plan,
    v_request.expected_seats,
    (now() + interval '30 days')::date,
    '0000'
  );

  update public.tenant_provision_requests
  set status = 'approved',
      reviewed_by_user_id = auth.uid(),
      review_notes = nullif(btrim(coalesce(p_review_notes, '')), ''),
      reviewed_at = coalesce(reviewed_at, now()),
      provisioned_tenant_id = v_tenant_id
  where id = p_request_id;

  insert into public.audit_events (
    tenant_id,
    actor_user_id,
    actor_role,
    action,
    target,
    detail
  )
  values (
    v_tenant_id,
    auth.uid(),
    'platform-admin',
    'tenant_provisioned',
    v_request.requestor_email,
    'Provisioned from tenant request approval'
  );

  perform public.insert_platform_audit_event(
    auth.uid(),
    auth.jwt() ->> 'email',
    'platform-admin',
    'tenant_provision_request_provisioned',
    v_request.requestor_email,
    format('Provisioned tenant %s from request for %s', v_tenant_id::text, v_request.organization_name),
    jsonb_build_object(
      'tenant_provision_request_id', v_request.id::text,
      'organization_name', v_request.organization_name,
      'from_status', v_original_status,
      'to_status', 'approved',
      'tenant_id', v_tenant_id::text,
      'requested_plan', v_request.requested_plan,
      'expected_seats', v_request.expected_seats
    )
  );

  v_subject := 'Tenant request approved and provisioned';
  v_body := format(
    'Your organization %s is ready. An access email can now be issued for %s.',
    v_request.organization_name,
    v_request.requestor_email
  );

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
    v_tenant_id,
    v_request.submitted_by_user_id,
    v_request.requestor_email,
    'email',
    'tenant_provision_request_provisioned',
    v_subject,
    v_body,
    'pending',
    jsonb_build_object(
      'tenant_provision_request_id', v_request.id::text,
      'tenant_id', v_tenant_id::text
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
      v_tenant_id,
      v_request.submitted_by_user_id,
      v_request.requestor_email,
      'in-app',
      'tenant_provision_request_provisioned',
      v_subject,
      v_body,
      'pending',
      jsonb_build_object(
        'tenant_provision_request_id', v_request.id::text,
        'tenant_id', v_tenant_id::text
      )
    );
  end if;

  return v_tenant_id;
end;
$$;
