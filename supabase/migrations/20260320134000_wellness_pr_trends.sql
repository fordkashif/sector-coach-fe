-- PaceLab Wellness + PR + Trends Foundation (Wave 5)
-- Created: 2026-03-20

create table if not exists public.wellness_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  entry_date date not null default current_date,
  sleep_hours numeric(4, 1) not null check (sleep_hours >= 0 and sleep_hours <= 24),
  soreness int not null check (soreness between 1 and 5),
  fatigue int not null check (fatigue between 1 and 5),
  mood int not null check (mood between 1 and 5),
  stress int not null check (stress between 1 and 5),
  training_load int not null check (training_load between 0 and 100),
  readiness text not null check (readiness in ('green', 'yellow', 'red')),
  readiness_score int not null check (readiness_score between 0 and 100),
  notes text,
  submitted_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (athlete_id, entry_date)
);

create table if not exists public.pr_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  event text not null,
  category text not null,
  best_value text not null,
  previous_value text,
  measured_on date not null,
  source_type text not null check (source_type in ('manual', 'test-week', 'import')),
  source_ref text,
  is_legal boolean not null default true,
  wind text,
  note text,
  recorded_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wellness_entries_tenant_athlete_date_idx
on public.wellness_entries (tenant_id, athlete_id, entry_date desc);

create index if not exists pr_records_tenant_athlete_date_idx
on public.pr_records (tenant_id, athlete_id, measured_on desc);

create index if not exists pr_records_tenant_category_idx
on public.pr_records (tenant_id, category);

create unique index if not exists pr_records_athlete_event_uniq
on public.pr_records (athlete_id, event);

drop trigger if exists set_updated_at_wellness_entries on public.wellness_entries;
create trigger set_updated_at_wellness_entries
before update on public.wellness_entries
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_pr_records on public.pr_records;
create trigger set_updated_at_pr_records
before update on public.pr_records
for each row
execute function public.set_updated_at();

alter table public.wellness_entries enable row level security;
alter table public.pr_records enable row level security;

drop policy if exists wellness_entries_select_own_or_staff on public.wellness_entries;
create policy wellness_entries_select_own_or_staff
on public.wellness_entries
for select
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and (
    public.is_coach_or_admin()
    or athlete_id in (
      select a.id
      from public.athletes a
      where a.user_id = auth.uid()
        and a.tenant_id = public.current_tenant_id()
    )
  )
);

drop policy if exists wellness_entries_insert_own on public.wellness_entries;
create policy wellness_entries_insert_own
on public.wellness_entries
for insert
to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and athlete_id in (
    select a.id
    from public.athletes a
    where a.user_id = auth.uid()
      and a.tenant_id = public.current_tenant_id()
  )
);

drop policy if exists wellness_entries_update_own on public.wellness_entries;
create policy wellness_entries_update_own
on public.wellness_entries
for update
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and athlete_id in (
    select a.id
    from public.athletes a
    where a.user_id = auth.uid()
      and a.tenant_id = public.current_tenant_id()
  )
)
with check (
  tenant_id = public.current_tenant_id()
  and athlete_id in (
    select a.id
    from public.athletes a
    where a.user_id = auth.uid()
      and a.tenant_id = public.current_tenant_id()
  )
);

drop policy if exists wellness_entries_staff_all on public.wellness_entries;
create policy wellness_entries_staff_all
on public.wellness_entries
for all
to authenticated
using (public.is_coach_or_admin() and tenant_id = public.current_tenant_id())
with check (public.is_coach_or_admin() and tenant_id = public.current_tenant_id());

drop policy if exists pr_records_select_own_or_staff on public.pr_records;
create policy pr_records_select_own_or_staff
on public.pr_records
for select
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and (
    public.is_coach_or_admin()
    or athlete_id in (
      select a.id
      from public.athletes a
      where a.user_id = auth.uid()
        and a.tenant_id = public.current_tenant_id()
    )
  )
);

drop policy if exists pr_records_staff_all on public.pr_records;
create policy pr_records_staff_all
on public.pr_records
for all
to authenticated
using (public.is_coach_or_admin() and tenant_id = public.current_tenant_id())
with check (public.is_coach_or_admin() and tenant_id = public.current_tenant_id());

drop policy if exists pr_records_insert_own_test_week on public.pr_records;
create policy pr_records_insert_own_test_week
on public.pr_records
for insert
to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and source_type = 'test-week'
  and athlete_id in (
    select a.id
    from public.athletes a
    where a.user_id = auth.uid()
      and a.tenant_id = public.current_tenant_id()
  )
);

drop policy if exists pr_records_update_own_test_week on public.pr_records;
create policy pr_records_update_own_test_week
on public.pr_records
for update
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and source_type = 'test-week'
  and athlete_id in (
    select a.id
    from public.athletes a
    where a.user_id = auth.uid()
      and a.tenant_id = public.current_tenant_id()
  )
)
with check (
  tenant_id = public.current_tenant_id()
  and source_type = 'test-week'
  and athlete_id in (
    select a.id
    from public.athletes a
    where a.user_id = auth.uid()
      and a.tenant_id = public.current_tenant_id()
  )
);
