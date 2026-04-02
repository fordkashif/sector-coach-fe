create table if not exists public.tenant_package_upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  requested_by_user_id uuid not null references auth.users(id) on delete cascade,
  current_package text not null check (current_package in ('starter', 'pro', 'enterprise')),
  requested_package text not null check (requested_package in ('starter', 'pro', 'enterprise')),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  review_notes text,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenant_package_upgrade_requests_tenant_created_idx
on public.tenant_package_upgrade_requests (tenant_id, created_at desc);

create unique index if not exists tenant_package_upgrade_requests_pending_unique_idx
on public.tenant_package_upgrade_requests (tenant_id)
where status = 'pending';

drop trigger if exists set_updated_at_tenant_package_upgrade_requests on public.tenant_package_upgrade_requests;
create trigger set_updated_at_tenant_package_upgrade_requests
before update on public.tenant_package_upgrade_requests
for each row execute function public.set_updated_at();

alter table public.tenant_package_upgrade_requests enable row level security;

drop policy if exists tenant_package_upgrade_requests_club_admin_select on public.tenant_package_upgrade_requests;
create policy tenant_package_upgrade_requests_club_admin_select
on public.tenant_package_upgrade_requests
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.tenant_id = tenant_package_upgrade_requests.tenant_id
      and p.role = 'club-admin'
  )
);

drop policy if exists tenant_package_upgrade_requests_club_admin_insert on public.tenant_package_upgrade_requests;
create policy tenant_package_upgrade_requests_club_admin_insert
on public.tenant_package_upgrade_requests
for insert
with check (
  requested_by_user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.tenant_id = tenant_package_upgrade_requests.tenant_id
      and p.role = 'club-admin'
  )
);

drop policy if exists tenant_package_upgrade_requests_platform_admin_select on public.tenant_package_upgrade_requests;
create policy tenant_package_upgrade_requests_platform_admin_select
on public.tenant_package_upgrade_requests
for select
using (
  exists (
    select 1
    from public.platform_admin_contacts pac
    where pac.is_active = true
      and (pac.user_id = auth.uid() or pac.email = lower(coalesce(auth.jwt() ->> 'email', '')))
  )
);

drop policy if exists tenant_package_upgrade_requests_platform_admin_update on public.tenant_package_upgrade_requests;
create policy tenant_package_upgrade_requests_platform_admin_update
on public.tenant_package_upgrade_requests
for update
using (
  exists (
    select 1
    from public.platform_admin_contacts pac
    where pac.is_active = true
      and (pac.user_id = auth.uid() or pac.email = lower(coalesce(auth.jwt() ->> 'email', '')))
  )
)
with check (
  exists (
    select 1
    from public.platform_admin_contacts pac
    where pac.is_active = true
      and (pac.user_id = auth.uid() or pac.email = lower(coalesce(auth.jwt() ->> 'email', '')))
  )
);

create or replace function public.submit_tenant_package_upgrade_request(
  p_requested_package text,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_request public.tenant_provision_requests%rowtype;
  v_existing public.tenant_package_upgrade_requests%rowtype;
  v_upgrade_id uuid;
begin
  select *
  into v_profile
  from public.profiles
  where user_id = auth.uid()
    and role = 'club-admin'
  limit 1;

  if v_profile.user_id is null then
    raise exception 'Only club-admin users can submit package upgrade requests.';
  end if;

  if p_requested_package not in ('starter', 'pro', 'enterprise') then
    raise exception 'Requested package is invalid.';
  end if;

  select *
  into v_request
  from public.tenant_provision_requests
  where provisioned_tenant_id = v_profile.tenant_id
  order by created_at desc
  limit 1;

  if v_request.id is null then
    raise exception 'No tenant provisioning request was found for the current tenant.';
  end if;

  if v_request.requested_plan = p_requested_package then
    raise exception 'Requested package matches the current tenant package.';
  end if;

  select *
  into v_existing
  from public.tenant_package_upgrade_requests
  where tenant_id = v_profile.tenant_id
    and status = 'pending'
  limit 1;

  if v_existing.id is not null then
    raise exception 'A pending package upgrade request already exists for this tenant.';
  end if;

  insert into public.tenant_package_upgrade_requests (
    tenant_id,
    requested_by_user_id,
    current_package,
    requested_package,
    reason,
    status
  ) values (
    v_profile.tenant_id,
    auth.uid(),
    v_request.requested_plan,
    p_requested_package,
    nullif(trim(coalesce(p_reason, '')), ''),
    'pending'
  )
  returning id into v_upgrade_id;

  insert into public.audit_events (
    tenant_id,
    actor_user_id,
    actor_role,
    action,
    target,
    detail
  ) values (
    v_profile.tenant_id,
    auth.uid(),
    'club-admin',
    'package_upgrade_requested',
    p_requested_package,
    format('Requested package upgrade from %s to %s.', v_request.requested_plan, p_requested_package)
  );

  return v_upgrade_id;
end;
$$;

grant execute on function public.submit_tenant_package_upgrade_request(text, text) to authenticated;

create or replace function public.review_tenant_package_upgrade_request(
  p_upgrade_request_id uuid,
  p_status text,
  p_review_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_platform_admin public.platform_admin_contacts%rowtype;
  v_upgrade public.tenant_package_upgrade_requests%rowtype;
  v_request public.tenant_provision_requests%rowtype;
begin
  select *
  into v_platform_admin
  from public.platform_admin_contacts
  where is_active = true
    and (user_id = auth.uid() or email = lower(coalesce(auth.jwt() ->> 'email', '')))
  limit 1;

  if v_platform_admin.id is null then
    raise exception 'Only platform-admin users can review package upgrade requests.';
  end if;

  if p_status not in ('approved', 'rejected', 'cancelled') then
    raise exception 'Upgrade request status is invalid.';
  end if;

  select *
  into v_upgrade
  from public.tenant_package_upgrade_requests
  where id = p_upgrade_request_id
  limit 1;

  if v_upgrade.id is null then
    raise exception 'Package upgrade request not found.';
  end if;

  if v_upgrade.status <> 'pending' then
    raise exception 'Only pending package upgrade requests can be reviewed.';
  end if;

  update public.tenant_package_upgrade_requests
  set status = p_status,
      review_notes = nullif(trim(coalesce(p_review_notes, '')), ''),
      reviewed_by_user_id = auth.uid(),
      reviewed_at = now()
  where id = p_upgrade_request_id;

  if p_status = 'approved' then
    select *
    into v_request
    from public.tenant_provision_requests
    where provisioned_tenant_id = v_upgrade.tenant_id
    order by created_at desc
    limit 1;

    if v_request.id is not null then
      update public.tenant_provision_requests
      set requested_plan = v_upgrade.requested_package,
          updated_at = now()
      where id = v_request.id;
    end if;
  end if;

  insert into public.platform_audit_events (
    actor_user_id,
    actor_email,
    actor_role,
    action,
    target,
    detail,
    metadata
  ) values (
    auth.uid(),
    v_platform_admin.email,
    'platform-admin',
    'tenant_package_upgrade_reviewed',
    v_upgrade.tenant_id::text,
    format('Package upgrade request moved to %s.', p_status),
    jsonb_build_object(
      'upgrade_request_id', v_upgrade.id,
      'current_package', v_upgrade.current_package,
      'requested_package', v_upgrade.requested_package,
      'status', p_status,
      'review_notes', nullif(trim(coalesce(p_review_notes, '')), '')
    )
  );
end;
$$;

grant execute on function public.review_tenant_package_upgrade_request(uuid, text, text) to authenticated;
