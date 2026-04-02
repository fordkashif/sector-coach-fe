create or replace function public.set_tenant_request_lifecycle_state(
  p_request_id uuid,
  p_lifecycle_status text,
  p_billing_status text default null,
  p_review_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_email text;
  v_request public.tenant_provision_requests%rowtype;
begin
  select lower(auth.email()) into v_actor_email;

  if v_actor_email is null then
    raise exception 'Authentication required.';
  end if;

  if not exists (
    select 1
    from public.platform_admin_contacts pac
    where pac.email = v_actor_email
      and pac.is_active = true
  ) then
    raise exception 'Only active platform admins can update tenant lifecycle.';
  end if;

  select *
  into v_request
  from public.tenant_provision_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Tenant provisioning request not found.';
  end if;

  if p_lifecycle_status not in ('approved_pending_billing', 'billing_failed', 'active_onboarding', 'active', 'suspended', 'cancelled') then
    raise exception 'Unsupported lifecycle status %.', p_lifecycle_status;
  end if;

  update public.tenant_provision_requests
  set lifecycle_status = p_lifecycle_status,
      previous_lifecycle_status = case
        when p_lifecycle_status = 'suspended' and lifecycle_status <> 'suspended' then lifecycle_status
        when lifecycle_status = 'suspended' and p_lifecycle_status <> 'suspended' then null
        else previous_lifecycle_status
      end,
      billing_status = coalesce(p_billing_status, billing_status),
      billing_failed_at = case when p_lifecycle_status = 'billing_failed' then now() else billing_failed_at end,
      review_notes = coalesce(nullif(trim(coalesce(p_review_notes, '')), ''), review_notes),
      reviewed_at = case when reviewed_at is null then now() else reviewed_at end
  where id = p_request_id;

  perform public.insert_platform_audit_event(
    p_actor_user_id := auth.uid(),
    p_actor_email := v_actor_email,
    p_actor_role := 'platform-admin',
    p_action := 'tenant_request_lifecycle_updated',
    p_target := v_request.organization_name,
    p_detail := format('Lifecycle moved to %s.', p_lifecycle_status),
    p_metadata := jsonb_build_object(
      'request_id', p_request_id,
      'requestor_email', v_request.requestor_email,
      'lifecycle_status', p_lifecycle_status,
      'billing_status', coalesce(p_billing_status, v_request.billing_status),
      'review_notes', nullif(trim(coalesce(p_review_notes, '')), '')
    )
  );
end;
$$;

grant execute on function public.set_tenant_request_lifecycle_state(uuid, text, text, text) to authenticated;
