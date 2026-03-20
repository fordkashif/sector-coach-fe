-- PaceLab Training Plan Foundation (Wave 4)
-- Created: 2026-03-20

create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  team_id uuid references public.teams(id) on delete set null,
  name text not null,
  start_date date not null,
  weeks int not null check (weeks > 0),
  status text not null check (status in ('draft', 'published', 'archived')) default 'draft',
  notes text,
  created_by_user_id uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_plan_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  plan_id uuid not null references public.training_plans(id) on delete cascade,
  scope text not null check (scope in ('team', 'athlete')),
  team_id uuid references public.teams(id) on delete set null,
  athlete_id uuid references public.athletes(id) on delete set null,
  visibility_start text not null check (visibility_start in ('immediate', 'scheduled')) default 'immediate',
  visibility_date date,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (
    (scope = 'team' and team_id is not null and athlete_id is null)
    or (scope = 'athlete' and athlete_id is not null)
  )
);

create table if not exists public.training_plan_weeks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans(id) on delete cascade,
  week_number int not null check (week_number > 0),
  emphasis text,
  status text not null check (status in ('completed', 'current', 'up-next')) default 'up-next',
  created_at timestamptz not null default now(),
  unique (plan_id, week_number)
);

create table if not exists public.training_plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_week_id uuid not null references public.training_plan_weeks(id) on delete cascade,
  day_index int not null check (day_index >= 0 and day_index <= 6),
  day_label text not null,
  date date not null,
  title text not null,
  session_type text not null check (session_type in ('Track', 'Gym', 'Recovery', 'Technical', 'Mixed')),
  focus text not null,
  status text not null check (status in ('completed', 'scheduled', 'up-next')) default 'up-next',
  duration_minutes int check (duration_minutes is null or duration_minutes > 0),
  location text,
  coach_note text,
  is_training_day boolean not null default true,
  created_at timestamptz not null default now(),
  unique (plan_week_id, day_index)
);

create table if not exists public.training_plan_blocks (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references public.training_plan_days(id) on delete cascade,
  sort_order int not null check (sort_order >= 0),
  preview_text text not null,
  created_at timestamptz not null default now(),
  unique (plan_day_id, sort_order)
);

create index if not exists training_plans_tenant_status_idx
on public.training_plans (tenant_id, status, start_date desc);

create index if not exists training_plans_team_idx
on public.training_plans (team_id);

create index if not exists training_plan_assignments_tenant_scope_idx
on public.training_plan_assignments (tenant_id, scope);

create index if not exists training_plan_assignments_team_idx
on public.training_plan_assignments (team_id);

create index if not exists training_plan_assignments_athlete_idx
on public.training_plan_assignments (athlete_id);

create index if not exists training_plan_assignments_plan_idx
on public.training_plan_assignments (plan_id);

create index if not exists training_plan_weeks_plan_week_idx
on public.training_plan_weeks (plan_id, week_number);

create index if not exists training_plan_days_plan_week_day_idx
on public.training_plan_days (plan_week_id, day_index);

create index if not exists training_plan_blocks_day_sort_idx
on public.training_plan_blocks (plan_day_id, sort_order);

drop trigger if exists set_updated_at_training_plans on public.training_plans;
create trigger set_updated_at_training_plans
before update on public.training_plans
for each row
execute function public.set_updated_at();

