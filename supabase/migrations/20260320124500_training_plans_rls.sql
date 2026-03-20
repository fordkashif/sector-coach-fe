-- PaceLab Training Plan RLS Policies (Wave 4)
-- Created: 2026-03-20

alter table public.training_plans enable row level security;
alter table public.training_plan_assignments enable row level security;
alter table public.training_plan_weeks enable row level security;
alter table public.training_plan_days enable row level security;
alter table public.training_plan_blocks enable row level security;

drop policy if exists training_plans_select_tenant on public.training_plans;
create policy training_plans_select_tenant
on public.training_plans
for select
to authenticated
using (tenant_id = public.current_tenant_id());

drop policy if exists training_plans_staff_all on public.training_plans;
create policy training_plans_staff_all
on public.training_plans
for all
to authenticated
using (public.is_coach_or_admin() and tenant_id = public.current_tenant_id())
with check (public.is_coach_or_admin() and tenant_id = public.current_tenant_id());

drop policy if exists training_plan_assignments_select_own_or_staff on public.training_plan_assignments;
create policy training_plan_assignments_select_own_or_staff
on public.training_plan_assignments
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
    or team_id in (
      select a.team_id
      from public.athletes a
      where a.user_id = auth.uid()
        and a.tenant_id = public.current_tenant_id()
    )
  )
);

drop policy if exists training_plan_assignments_staff_all on public.training_plan_assignments;
create policy training_plan_assignments_staff_all
on public.training_plan_assignments
for all
to authenticated
using (public.is_coach_or_admin() and tenant_id = public.current_tenant_id())
with check (public.is_coach_or_admin() and tenant_id = public.current_tenant_id());

drop policy if exists training_plan_weeks_select_tenant on public.training_plan_weeks;
create policy training_plan_weeks_select_tenant
on public.training_plan_weeks
for select
to authenticated
using (
  exists (
    select 1
    from public.training_plans tp
    where tp.id = plan_id
      and tp.tenant_id = public.current_tenant_id()
  )
);

drop policy if exists training_plan_weeks_staff_all on public.training_plan_weeks;
create policy training_plan_weeks_staff_all
on public.training_plan_weeks
for all
to authenticated
using (
  public.is_coach_or_admin()
  and exists (
    select 1
    from public.training_plans tp
    where tp.id = plan_id
      and tp.tenant_id = public.current_tenant_id()
  )
)
with check (
  public.is_coach_or_admin()
  and exists (
    select 1
    from public.training_plans tp
    where tp.id = plan_id
      and tp.tenant_id = public.current_tenant_id()
  )
);

drop policy if exists training_plan_days_select_tenant on public.training_plan_days;
create policy training_plan_days_select_tenant
on public.training_plan_days
for select
to authenticated
using (
  exists (
    select 1
    from public.training_plan_weeks tpw
    join public.training_plans tp on tp.id = tpw.plan_id
    where tpw.id = plan_week_id
      and tp.tenant_id = public.current_tenant_id()
  )
);

drop policy if exists training_plan_days_staff_all on public.training_plan_days;
create policy training_plan_days_staff_all
on public.training_plan_days
for all
to authenticated
using (
  public.is_coach_or_admin()
  and exists (
    select 1
    from public.training_plan_weeks tpw
    join public.training_plans tp on tp.id = tpw.plan_id
    where tpw.id = plan_week_id
      and tp.tenant_id = public.current_tenant_id()
  )
)
with check (
  public.is_coach_or_admin()
  and exists (
    select 1
    from public.training_plan_weeks tpw
    join public.training_plans tp on tp.id = tpw.plan_id
    where tpw.id = plan_week_id
      and tp.tenant_id = public.current_tenant_id()
  )
);

drop policy if exists training_plan_blocks_select_tenant on public.training_plan_blocks;
create policy training_plan_blocks_select_tenant
on public.training_plan_blocks
for select
to authenticated
using (
  exists (
    select 1
    from public.training_plan_days tpd
    join public.training_plan_weeks tpw on tpw.id = tpd.plan_week_id
    join public.training_plans tp on tp.id = tpw.plan_id
    where tpd.id = plan_day_id
      and tp.tenant_id = public.current_tenant_id()
  )
);

drop policy if exists training_plan_blocks_staff_all on public.training_plan_blocks;
create policy training_plan_blocks_staff_all
on public.training_plan_blocks
for all
to authenticated
using (
  public.is_coach_or_admin()
  and exists (
    select 1
    from public.training_plan_days tpd
    join public.training_plan_weeks tpw on tpw.id = tpd.plan_week_id
    join public.training_plans tp on tp.id = tpw.plan_id
    where tpd.id = plan_day_id
      and tp.tenant_id = public.current_tenant_id()
  )
)
with check (
  public.is_coach_or_admin()
  and exists (
    select 1
    from public.training_plan_days tpd
    join public.training_plan_weeks tpw on tpw.id = tpd.plan_week_id
    join public.training_plans tp on tp.id = tpw.plan_id
    where tpd.id = plan_day_id
      and tp.tenant_id = public.current_tenant_id()
  )
);

