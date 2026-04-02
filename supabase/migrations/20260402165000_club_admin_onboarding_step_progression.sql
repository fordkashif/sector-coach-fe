-- Club-admin onboarding step progression helper
-- Created: 2026-04-02

create or replace function public.update_current_club_admin_onboarding_step(
  p_step text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
begin
  if v_user_id is null then
    raise exception 'No authenticated user';
  end if;

  if p_step not in ('club_profile', 'branding', 'first_team', 'coach_access', 'review', 'complete') then
    raise exception 'Invalid onboarding step';
  end if;

  select *
  into v_profile
  from public.profiles
  where user_id = v_user_id
    and role = 'club-admin'
  limit 1;

  if not found then
    raise exception 'Only club-admin users can update onboarding progression';
  end if;

  update public.tenants
  set
    onboarding_step = p_step,
    branding_completed_at = case when p_step in ('branding', 'first_team', 'coach_access', 'review', 'complete') then coalesce(branding_completed_at, now()) else branding_completed_at end,
    first_team_completed_at = case when p_step in ('coach_access', 'review', 'complete') then coalesce(first_team_completed_at, now()) else first_team_completed_at end,
    coach_access_completed_at = case when p_step in ('review', 'complete') then coalesce(coach_access_completed_at, now()) else coach_access_completed_at end
  where id = v_profile.tenant_id;

  return v_profile.tenant_id;
end;
$$;

grant execute on function public.update_current_club_admin_onboarding_step(text) to authenticated;
