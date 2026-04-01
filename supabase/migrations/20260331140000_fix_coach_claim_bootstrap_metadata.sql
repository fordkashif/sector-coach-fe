-- Fix coach claim bootstrap metadata and repair accepted coach accounts missing profiles
-- Created: 2026-03-31

with accepted_coach_invites as (
  select
    au.id as user_id,
    au.email,
    ci.tenant_id,
    ci.team_id,
    ci.invited_by_user_id,
    case
      when coalesce(ci.role, 'coach') in ('coach', 'club-admin') then coalesce(ci.role, 'coach')
      else 'coach'
    end as role,
    coalesce(
      nullif(trim(coalesce(au.raw_user_meta_data ->> 'display_name', '')), ''),
      nullif(trim(coalesce(ci.metadata ->> 'display_name', '')), ''),
      split_part(coalesce(au.email, ''), '@', 1)
    ) as display_name,
    row_number() over (
      partition by au.id
      order by ci.accepted_at desc nulls last, ci.updated_at desc nulls last, ci.created_at desc nulls last
    ) as invite_rank
  from auth.users au
  join public.coach_invites ci
    on lower(coalesce(ci.email, '')) = lower(coalesce(au.email, ''))
  left join public.profiles p
    on p.user_id = au.id
  where ci.status = 'accepted'
    and p.user_id is null
),
selected_invites as (
  select *
  from accepted_coach_invites
  where invite_rank = 1
)
update auth.users au
set raw_user_meta_data = coalesce(au.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'display_name', si.display_name,
    'role', si.role,
    'tenant_id', si.tenant_id::text
  )
from selected_invites si
where au.id = si.user_id;

with accepted_coach_invites as (
  select
    au.id as user_id,
    au.email,
    ci.tenant_id,
    ci.team_id,
    ci.invited_by_user_id,
    case
      when coalesce(ci.role, 'coach') in ('coach', 'club-admin') then coalesce(ci.role, 'coach')
      else 'coach'
    end as role,
    coalesce(
      nullif(trim(coalesce(au.raw_user_meta_data ->> 'display_name', '')), ''),
      nullif(trim(coalesce(ci.metadata ->> 'display_name', '')), ''),
      split_part(coalesce(au.email, ''), '@', 1)
    ) as display_name,
    row_number() over (
      partition by au.id
      order by ci.accepted_at desc nulls last, ci.updated_at desc nulls last, ci.created_at desc nulls last
    ) as invite_rank
  from auth.users au
  join public.coach_invites ci
    on lower(coalesce(ci.email, '')) = lower(coalesce(au.email, ''))
  left join public.profiles p
    on p.user_id = au.id
  where ci.status = 'accepted'
    and p.user_id is null
),
selected_invites as (
  select *
  from accepted_coach_invites
  where invite_rank = 1
)
insert into public.profiles (
  user_id,
  tenant_id,
  role,
  display_name,
  is_active
)
select
  si.user_id,
  si.tenant_id,
  si.role,
  si.display_name,
  true
from selected_invites si
on conflict (user_id) do nothing;

with accepted_coach_invites as (
  select
    au.id as user_id,
    ci.tenant_id,
    ci.team_id,
    ci.invited_by_user_id,
    case
      when coalesce(ci.role, 'coach') in ('coach', 'club-admin') then coalesce(ci.role, 'coach')
      else 'coach'
    end as role,
    row_number() over (
      partition by au.id
      order by ci.accepted_at desc nulls last, ci.updated_at desc nulls last, ci.created_at desc nulls last
    ) as invite_rank
  from auth.users au
  join public.coach_invites ci
    on lower(coalesce(ci.email, '')) = lower(coalesce(au.email, ''))
  where ci.status = 'accepted'
), 
selected_invites as (
  select *
  from accepted_coach_invites
  where invite_rank = 1
    and team_id is not null
)
insert into public.team_coaches (
  tenant_id,
  team_id,
  user_id,
  is_primary,
  created_by_user_id
)
select
  si.tenant_id,
  si.team_id,
  si.user_id,
  true,
  si.invited_by_user_id
from selected_invites si
join public.profiles p
  on p.user_id = si.user_id
 and p.role = 'coach'
on conflict (team_id, user_id) do update
set is_primary = excluded.is_primary;
