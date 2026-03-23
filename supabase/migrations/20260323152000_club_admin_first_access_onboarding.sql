-- Club-admin first-access onboarding state
-- Created: 2026-03-23

alter table public.club_profiles
  add column if not exists password_set_at timestamptz,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists onboarding_completed_by_user_id uuid;

update public.club_profiles
set
  password_set_at = coalesce(password_set_at, updated_at, created_at, now()),
  onboarding_completed_at = coalesce(onboarding_completed_at, updated_at, created_at, now()),
  onboarding_completed_by_user_id = coalesce(onboarding_completed_by_user_id, null)
where password_set_at is null
  and onboarding_completed_at is null;
