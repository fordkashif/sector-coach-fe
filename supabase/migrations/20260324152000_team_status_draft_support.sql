-- Add draft/active/archived status support to teams
-- Created: 2026-03-24

alter table public.teams
add column if not exists status text;

update public.teams
set status = case when is_archived then 'archived' else 'active' end
where status is null;

alter table public.teams
alter column status set default 'active';

alter table public.teams
alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'teams_status_check'
      and conrelid = 'public.teams'::regclass
  ) then
    alter table public.teams
      add constraint teams_status_check
      check (status in ('draft', 'active', 'archived'));
  end if;
end $$;

update public.teams
set
  is_archived = (status = 'archived'),
  archived_at = case
    when status = 'archived' then coalesce(archived_at, now())
    else null
  end;
