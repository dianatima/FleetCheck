-- Fix driver inspection RLS so drivers are validated by drivers.user_id = auth.uid().
-- Manager/admin access remains company-scoped through profiles/company_owners.

alter table public.inspections enable row level security;
alter table public.inspection_results enable row level security;
alter table public.vehicle_assignments enable row level security;

drop policy if exists inspections_active_driver_select_own on public.inspections;
drop policy if exists inspections_active_driver_insert_own on public.inspections;
drop policy if exists inspections_active_driver_finish_own on public.inspections;
drop policy if exists inspection_results_active_driver_own on public.inspection_results;
drop policy if exists assignments_active_driver_select_own on public.vehicle_assignments;
drop policy if exists assignments_active_driver_insert_own on public.vehicle_assignments;
drop policy if exists assignments_active_driver_close_own on public.vehicle_assignments;

drop policy if exists inspections_driver_select_own on public.inspections;
create policy inspections_driver_select_own
on public.inspections
for select
to authenticated
using (
  exists (
    select 1
    from public.drivers as driver
    where driver.id = inspections.driver_id
      and driver.user_id = auth.uid()
      and driver.status = 'active'
      and driver.company_id = inspections.company_id
  )
);

drop policy if exists inspections_driver_insert_own on public.inspections;
create policy inspections_driver_insert_own
on public.inspections
for insert
to authenticated
with check (
  status = 'draft'
  and exists (
    select 1
    from public.drivers as driver
    where driver.id = inspections.driver_id
      and driver.user_id = auth.uid()
      and driver.status = 'active'
      and driver.company_id = inspections.company_id
  )
);

drop policy if exists inspections_driver_update_own on public.inspections;
create policy inspections_driver_update_own
on public.inspections
for update
to authenticated
using (
  exists (
    select 1
    from public.drivers as driver
    where driver.id = inspections.driver_id
      and driver.user_id = auth.uid()
      and driver.status = 'active'
      and driver.company_id = inspections.company_id
  )
)
with check (
  status in ('draft', 'submitted', 'approved', 'needs-review', 'rejected')
  and exists (
    select 1
    from public.drivers as driver
    where driver.id = inspections.driver_id
      and driver.user_id = auth.uid()
      and driver.status = 'active'
      and driver.company_id = inspections.company_id
  )
);

drop policy if exists inspections_company_managers_all on public.inspections;
create policy inspections_company_managers_all
on public.inspections
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles as profile
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = inspections.company_id
    where profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = inspections.company_id
          and profile.role::text in ('owner', 'manager', 'admin')
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles as profile
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = inspections.company_id
    where profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = inspections.company_id
          and profile.role::text in ('owner', 'manager', 'admin')
        )
      )
  )
);

drop policy if exists inspection_results_driver_select_own on public.inspection_results;
create policy inspection_results_driver_select_own
on public.inspection_results
for select
to authenticated
using (
  exists (
    select 1
    from public.inspections as inspection
    join public.drivers as driver on driver.id = inspection.driver_id
    where inspection.id = inspection_results.inspection_id
      and driver.user_id = auth.uid()
      and driver.status = 'active'
      and driver.company_id = inspection.company_id
  )
);

drop policy if exists inspection_results_driver_insert_own on public.inspection_results;
create policy inspection_results_driver_insert_own
on public.inspection_results
for insert
to authenticated
with check (
  exists (
    select 1
    from public.inspections as inspection
    join public.drivers as driver on driver.id = inspection.driver_id
    where inspection.id = inspection_results.inspection_id
      and driver.user_id = auth.uid()
      and driver.status = 'active'
      and driver.company_id = inspection.company_id
  )
);

drop policy if exists inspection_results_driver_update_own on public.inspection_results;
create policy inspection_results_driver_update_own
on public.inspection_results
for update
to authenticated
using (
  exists (
    select 1
    from public.inspections as inspection
    join public.drivers as driver on driver.id = inspection.driver_id
    where inspection.id = inspection_results.inspection_id
      and driver.user_id = auth.uid()
      and driver.status = 'active'
      and driver.company_id = inspection.company_id
  )
)
with check (
  exists (
    select 1
    from public.inspections as inspection
    join public.drivers as driver on driver.id = inspection.driver_id
    where inspection.id = inspection_results.inspection_id
      and driver.user_id = auth.uid()
      and driver.status = 'active'
      and driver.company_id = inspection.company_id
  )
);

drop policy if exists inspection_results_company_managers_all on public.inspection_results;
create policy inspection_results_company_managers_all
on public.inspection_results
for all
to authenticated
using (
  exists (
    select 1
    from public.inspections as inspection
    join public.profiles as profile on true
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = inspection.company_id
    where inspection.id = inspection_results.inspection_id
      and profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = inspection.company_id
          and profile.role::text in ('owner', 'manager', 'admin')
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.inspections as inspection
    join public.profiles as profile on true
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = inspection.company_id
    where inspection.id = inspection_results.inspection_id
      and profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = inspection.company_id
          and profile.role::text in ('owner', 'manager', 'admin')
        )
      )
  )
);

drop policy if exists vehicle_assignments_driver_select_own on public.vehicle_assignments;
create policy vehicle_assignments_driver_select_own
on public.vehicle_assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.drivers as driver
    where driver.id = vehicle_assignments.driver_id
      and driver.user_id = auth.uid()
      and driver.status = 'active'
      and driver.company_id = vehicle_assignments.company_id
  )
);

drop policy if exists vehicle_assignments_driver_insert_own on public.vehicle_assignments;
create policy vehicle_assignments_driver_insert_own
on public.vehicle_assignments
for insert
to authenticated
with check (
  status = 'active'
  and end_at is null
  and exists (
    select 1
    from public.drivers as driver
    where driver.id = vehicle_assignments.driver_id
      and driver.user_id = auth.uid()
      and driver.status = 'active'
      and driver.company_id = vehicle_assignments.company_id
  )
);

drop policy if exists vehicle_assignments_driver_update_own on public.vehicle_assignments;
create policy vehicle_assignments_driver_update_own
on public.vehicle_assignments
for update
to authenticated
using (
  status = 'active'
  and exists (
    select 1
    from public.drivers as driver
    where driver.id = vehicle_assignments.driver_id
      and driver.user_id = auth.uid()
      and driver.status = 'active'
      and driver.company_id = vehicle_assignments.company_id
  )
)
with check (
  status in ('active', 'completed', 'cancelled')
  and exists (
    select 1
    from public.drivers as driver
    where driver.id = vehicle_assignments.driver_id
      and driver.user_id = auth.uid()
      and driver.status = 'active'
      and driver.company_id = vehicle_assignments.company_id
  )
);

drop policy if exists vehicle_assignments_company_managers_all on public.vehicle_assignments;
create policy vehicle_assignments_company_managers_all
on public.vehicle_assignments
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles as profile
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = vehicle_assignments.company_id
    where profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = vehicle_assignments.company_id
          and profile.role::text in ('owner', 'manager', 'admin')
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles as profile
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = vehicle_assignments.company_id
    where profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = vehicle_assignments.company_id
          and profile.role::text in ('owner', 'manager', 'admin')
        )
      )
  )
);
