-- Coach invite claim and onboarding support
-- Created: 2026-03-24

alter table public.profiles
  add column if not exists password_set_at timestamptz,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists setup_guide_dismissed_at timestamptz;

update public.profiles
set
  password_set_at = coalesce(password_set_at, updated_at, created_at, now()),
  onboarding_completed_at = coalesce(onboarding_completed_at, updated_at, created_at, now())
where role = 'coach'
  and onboarding_completed_at is null;

create or replace function public.get_public_coach_invite(
  p_invite_id uuid
)
returns table (
  invite_id uuid,
  email text,
  status text,
  tenant_id uuid,
  organization_name text,
  team_id uuid,
  team_name text
)
language sql
security definer
set search_path = public
as $$
  select
    ci.id as invite_id,
    ci.email,
    ci.status,
    ci.tenant_id,
    t.name as organization_name,
    ci.team_id,
    tm.name as team_name
  from public.coach_invites ci
  join public.tenants t on t.id = ci.tenant_id
  left join public.teams tm on tm.id = ci.team_id
  where ci.id = p_invite_id
  limit 1
$$;

grant execute on function public.get_public_coach_invite(uuid) to anon, authenticated;

create or replace function public.complete_current_coach_onboarding(
  p_display_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.profiles
  set
    display_name = coalesce(nullif(trim(p_display_name), ''), display_name),
    password_set_at = coalesce(password_set_at, now()),
    onboarding_completed_at = coalesce(onboarding_completed_at, now()),
    updated_at = now()
  where user_id = v_user_id
    and role = 'coach';

  if not found then
    raise exception 'Coach profile not found for current user';
  end if;
end;
$$;

grant execute on function public.complete_current_coach_onboarding(text) to authenticated;

create or replace function public.set_current_coach_setup_guide_dismissed(
  p_dismissed boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.profiles
  set
    setup_guide_dismissed_at = case when p_dismissed then now() else null end,
    updated_at = now()
  where user_id = v_user_id
    and role = 'coach';

  if not found then
    raise exception 'Coach profile not found for current user';
  end if;
end;
$$;

grant execute on function public.set_current_coach_setup_guide_dismissed(boolean) to authenticated;
