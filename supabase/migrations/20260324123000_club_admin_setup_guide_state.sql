-- Club-admin dashboard walkthrough persistence
-- Created: 2026-03-24

alter table public.club_profiles
  add column if not exists setup_guide_dismissed_at timestamptz;
