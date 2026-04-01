-- Athlete invites must be email-addressed so claim routing is automatic.
-- Created: 2026-03-31

alter table public.athlete_invites
  add column if not exists email text;

create index if not exists athlete_invites_tenant_email_idx
on public.athlete_invites (tenant_id, email);

drop function if exists public.get_public_athlete_invite(uuid);

create or replace function public.get_public_athlete_invite(
  p_invite_id uuid
)
returns table (
  invite_id uuid,
  tenant_id uuid,
  team_id uuid,
  team_name text,
  organization_name text,
  event_group text,
  status text,
  email text,
  has_existing_account boolean
)
language sql
security definer
set search_path = public
as $$
  select
    ai.id as invite_id,
    ai.tenant_id,
    ai.team_id,
    t.name as team_name,
    ten.name as organization_name,
    t.event_group,
    ai.status,
    ai.email,
    case
      when nullif(trim(coalesce(ai.email, '')), '') is null then false
      else exists(
        select 1
        from auth.users au
        where lower(coalesce(au.email, '')) = lower(ai.email)
      )
    end as has_existing_account
  from public.athlete_invites ai
  join public.teams t on t.id = ai.team_id
  join public.tenants ten on ten.id = ai.tenant_id
  where ai.id = p_invite_id
  limit 1;
$$;

grant execute on function public.get_public_athlete_invite(uuid) to anon, authenticated;

create or replace function public.accept_athlete_invite(
  p_invite_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_invite public.athlete_invites%rowtype;
  v_athlete public.athletes%rowtype;
  v_user_email text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_profile
  from public.profiles p
  where p.user_id = v_user_id
  limit 1;

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_profile.role <> 'athlete' then
    raise exception 'Only athlete users can accept athlete invites';
  end if;

  select *
  into v_invite
  from public.athlete_invites ai
  where ai.id = p_invite_id
  limit 1;

  if not found then
    raise exception 'Invite not found';
  end if;

  if v_invite.tenant_id <> v_profile.tenant_id then
    raise exception 'Invite does not belong to your tenant';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Invite is not pending';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    update public.athlete_invites
    set status = 'expired',
        updated_at = now()
    where id = v_invite.id;

    raise exception 'Invite has expired';
  end if;

  select lower(coalesce(email, '')) into v_user_email from auth.users where id = v_user_id;

  if nullif(trim(coalesce(v_invite.email, '')), '') is not null
     and lower(trim(v_invite.email)) <> lower(coalesce(v_user_email, '')) then
    raise exception 'This invite is for a different email address';
  end if;

  select *
  into v_athlete
  from public.athletes a
  where a.user_id = v_user_id
    and a.tenant_id = v_profile.tenant_id
  limit 1;

  if not found then
    raise exception 'Athlete profile record not found';
  end if;

  update public.athletes
  set team_id = v_invite.team_id,
      is_active = true,
      updated_at = now()
  where id = v_athlete.id;

  update public.athlete_invites
  set status = 'accepted',
      accepted_by_user_id = v_user_id,
      accepted_at = now(),
      updated_at = now()
  where id = v_invite.id;

  insert into public.audit_events (
    tenant_id,
    actor_user_id,
    actor_role,
    action,
    target,
    detail
  )
  values (
    v_invite.tenant_id,
    v_user_id,
    'athlete',
    'athlete_invite_accept',
    coalesce(v_user_email, v_user_id::text),
    'joined team ' || v_invite.team_id::text
  );

  return v_invite.team_id;
end;
$$;

grant execute on function public.accept_athlete_invite(uuid) to authenticated;
