-- Driver vehicle availability, assignment, and inspection-session support.
-- Driver-facing vehicle access uses vehicle_type_id and never vehicles.type.

create table if not exists public.vehicle_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete cascade,
  driver_id uuid references public.drivers (id) on delete cascade,
  start_at timestamptz,
  end_at timestamptz,
  status text not null default 'scheduled',
  notes text,
  created_at timestamptz default now()
);

alter table public.vehicle_assignments
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz;

alter table public.vehicle_assignments
  drop constraint if exists vehicle_assignments_status_check;

alter table public.vehicle_assignments
  add constraint vehicle_assignments_status_check
  check (status in ('scheduled', 'active', 'completed', 'cancelled'));

create unique index if not exists vehicle_assignments_one_active_vehicle_idx
  on public.vehicle_assignments (vehicle_id)
  where status = 'active' and end_at is null;

create index if not exists vehicle_assignments_driver_active_idx
  on public.vehicle_assignments (driver_id, status, end_at);

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  driver_id uuid not null references public.drivers (id) on delete cascade,
  template_id uuid not null references public.inspection_templates (id),
  type text not null,
  status text not null default 'draft',
  odometer numeric,
  engine_hours numeric,
  signature_data_url text,
  signed_at timestamptz,
  signed_by_driver_id uuid references public.drivers (id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.vehicles
  add column if not exists odometer_unit text not null default 'mi';

alter table public.vehicles
  drop constraint if exists vehicles_odometer_unit_check;

alter table public.vehicles
  add constraint vehicles_odometer_unit_check
  check (odometer_unit in ('km', 'mi'));

create index if not exists inspections_driver_created_idx
  on public.inspections (driver_id, created_at desc);

create table if not exists public.inspection_results (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections (id) on delete cascade,
  template_item_id uuid not null references public.inspection_template_items (id),
  result text,
  comment text,
  photo_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.inspection_results
  drop constraint if exists inspection_results_status_check,
  drop constraint if exists inspection_results_result_check;

alter table public.inspection_results
  add constraint inspection_results_result_check
  check (result is null or result in ('pass', 'fail', 'not_applicable'));

create unique index if not exists inspection_results_item_per_inspection_idx
  on public.inspection_results (inspection_id, template_item_id);

create or replace function public.current_active_driver_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select driver.id
  from public.drivers as driver
  join public.profiles as profile on profile.id = driver.user_id
  where profile.auth_user_id = auth.uid()
    and profile.status = 'active'
    and driver.status = 'active'
  limit 1
$$;

create or replace function public.current_active_driver_company_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select driver.company_id
  from public.drivers as driver
  where driver.id = public.current_active_driver_id()
  limit 1
$$;

revoke all on function public.current_active_driver_id() from public;
revoke all on function public.current_active_driver_company_id() from public;
grant execute on function public.current_active_driver_id() to authenticated;
grant execute on function public.current_active_driver_company_id() to authenticated;

alter table public.vehicles enable row level security;
alter table public.drivers enable row level security;
alter table public.license_vehicle_type_rules enable row level security;
alter table public.vehicle_assignments enable row level security;
alter table public.repairs enable row level security;
alter table public.inspection_templates enable row level security;
alter table public.inspection_template_items enable row level security;
alter table public.inspections enable row level security;
alter table public.inspection_results enable row level security;

drop policy if exists drivers_active_driver_select_self on public.drivers;
create policy drivers_active_driver_select_self
on public.drivers
for select
using (id = public.current_active_driver_id());

drop policy if exists vehicles_active_driver_allowed_types on public.vehicles;
create policy vehicles_active_driver_allowed_types
on public.vehicles
for select
using (
  company_id = public.current_active_driver_company_id()
  and status not in ('blocked', 'inactive', 'in-repair')
  and exists (
    select 1
    from public.drivers as driver
    join public.license_vehicle_type_rules as access_rule
      on access_rule.company_id = driver.company_id
      and access_rule.vehicle_type_id = vehicles.vehicle_type_id
      and access_rule.license_class = driver.license_class
    where driver.id = public.current_active_driver_id()
  )
  and not exists (
    select 1
    from public.vehicle_assignments as assignment
    where assignment.vehicle_id = vehicles.id
      and assignment.status = 'active'
      and assignment.end_at is null
      and assignment.driver_id <> public.current_active_driver_id()
  )
  and not exists (
    select 1
    from public.repairs as repair
    where repair.vehicle_id = vehicles.id
      and repair.status in ('open', 'in-progress')
  )
);

drop policy if exists vehicles_driver_update_own_company on public.vehicles;
create policy vehicles_driver_update_own_company
on public.vehicles
for update
to authenticated
using (
  exists (
    select 1
    from public.drivers as driver
    where driver.user_id = auth.uid()
      and driver.status = 'active'
      and driver.company_id = vehicles.company_id
  )
)
with check (
  exists (
    select 1
    from public.drivers as driver
    where driver.user_id = auth.uid()
      and driver.status = 'active'
      and driver.company_id = vehicles.company_id
  )
);

drop policy if exists access_rules_active_driver_reads_own_company
  on public.license_vehicle_type_rules;
create policy access_rules_active_driver_reads_own_company
on public.license_vehicle_type_rules
for select
using (company_id = public.current_active_driver_company_id());

drop policy if exists assignments_active_driver_select_own on public.vehicle_assignments;
create policy assignments_active_driver_select_own
on public.vehicle_assignments
for select
using (driver_id = public.current_active_driver_id());

drop policy if exists assignments_active_driver_insert_own on public.vehicle_assignments;
create policy assignments_active_driver_insert_own
on public.vehicle_assignments
for insert
with check (
  driver_id = public.current_active_driver_id()
  and company_id = public.current_active_driver_company_id()
  and status = 'active'
  and end_at is null
  and exists (
    select 1
    from public.vehicles as vehicle
    where vehicle.id = vehicle_assignments.vehicle_id
      and vehicle.company_id = vehicle_assignments.company_id
  )
);

drop policy if exists assignments_active_driver_close_own on public.vehicle_assignments;
create policy assignments_active_driver_close_own
on public.vehicle_assignments
for update
using (driver_id = public.current_active_driver_id() and status = 'active')
with check (
  driver_id = public.current_active_driver_id()
  and status in ('completed', 'cancelled')
  and end_at is not null
);

drop policy if exists templates_active_driver_allowed_types on public.inspection_templates;
create policy templates_active_driver_allowed_types
on public.inspection_templates
for select
using (
  company_id = public.current_active_driver_company_id()
  and exists (
    select 1
    from public.drivers as driver
    join public.license_vehicle_type_rules as access_rule
      on access_rule.company_id = driver.company_id
      and access_rule.vehicle_type_id = inspection_templates.vehicle_type_id
      and access_rule.license_class = driver.license_class
    where driver.id = public.current_active_driver_id()
  )
);

drop policy if exists template_items_active_driver_template_read
  on public.inspection_template_items;
create policy template_items_active_driver_template_read
on public.inspection_template_items
for select
using (
  exists (
    select 1
    from public.inspection_templates as template
    where template.id = inspection_template_items.template_id
      and template.company_id = public.current_active_driver_company_id()
  )
);

drop policy if exists inspections_active_driver_select_own on public.inspections;
create policy inspections_active_driver_select_own
on public.inspections
for select
using (
  exists (
    select 1
    from public.drivers as driver
    join public.profiles as profile on profile.id = driver.user_id
    where driver.id = inspections.driver_id
      and driver.company_id = inspections.company_id
      and driver.status = 'active'
      and profile.status = 'active'
      and profile.auth_user_id = auth.uid()
  )
);

drop policy if exists inspections_active_driver_insert_own on public.inspections;
create policy inspections_active_driver_insert_own
on public.inspections
for insert
with check (
  status = 'draft'
  and exists (
    select 1
    from public.drivers as driver
    join public.profiles as profile on profile.id = driver.user_id
    where driver.id = inspections.driver_id
      and driver.company_id = inspections.company_id
      and driver.status = 'active'
      and profile.status = 'active'
      and profile.auth_user_id = auth.uid()
  )
);

drop policy if exists inspections_active_driver_finish_own on public.inspections;
create policy inspections_active_driver_finish_own
on public.inspections
for update
using (
  exists (
    select 1
    from public.drivers as driver
    join public.profiles as profile on profile.id = driver.user_id
    where driver.id = inspections.driver_id
      and driver.company_id = inspections.company_id
      and driver.status = 'active'
      and profile.status = 'active'
      and profile.auth_user_id = auth.uid()
  )
)
with check (
  status in ('draft', 'submitted', 'approved', 'needs-review', 'rejected')
  and exists (
    select 1
    from public.drivers as driver
    join public.profiles as profile on profile.id = driver.user_id
    where driver.id = inspections.driver_id
      and driver.company_id = inspections.company_id
      and driver.status = 'active'
      and profile.status = 'active'
      and profile.auth_user_id = auth.uid()
  )
);

drop policy if exists inspection_results_active_driver_own on public.inspection_results;
create policy inspection_results_active_driver_own
on public.inspection_results
for all
using (
  exists (
    select 1
    from public.inspections as inspection
    join public.drivers as driver on driver.id = inspection.driver_id
    join public.profiles as profile on profile.id = driver.user_id
    where inspection.id = inspection_results.inspection_id
      and driver.company_id = inspection.company_id
      and driver.status = 'active'
      and profile.status = 'active'
      and profile.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.inspections as inspection
    join public.drivers as driver on driver.id = inspection.driver_id
    join public.profiles as profile on profile.id = driver.user_id
    where inspection.id = inspection_results.inspection_id
      and driver.company_id = inspection.company_id
      and driver.status = 'active'
      and profile.status = 'active'
      and profile.auth_user_id = auth.uid()
  )
);
