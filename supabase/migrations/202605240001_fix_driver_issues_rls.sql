alter table public.issues enable row level security;

drop policy if exists issues_driver_insert_from_own_inspection on public.issues;
create policy issues_driver_insert_from_own_inspection
on public.issues
for insert
to authenticated
with check (
  exists (
    select 1
    from public.inspections inspection
    join public.drivers driver on driver.id = inspection.driver_id
    join public.profiles profile on profile.id = driver.user_id
    where inspection.id = issues.inspection_id
      and inspection.driver_id = issues.driver_id
      and inspection.vehicle_id = issues.vehicle_id
      and inspection.company_id = issues.company_id
      and driver.status = 'active'
      and driver.company_id = issues.company_id
      and profile.auth_user_id = auth.uid()
  )
);

drop policy if exists issues_driver_select_own_inspection on public.issues;
create policy issues_driver_select_own_inspection
on public.issues
for select
to authenticated
using (
  exists (
    select 1
    from public.inspections inspection
    join public.drivers driver on driver.id = inspection.driver_id
    join public.profiles profile on profile.id = driver.user_id
    where inspection.id = issues.inspection_id
      and inspection.driver_id = issues.driver_id
      and driver.company_id = issues.company_id
      and profile.auth_user_id = auth.uid()
  )
);

drop policy if exists issues_driver_update_own_inspection on public.issues;
create policy issues_driver_update_own_inspection
on public.issues
for update
to authenticated
using (
  exists (
    select 1
    from public.inspections inspection
    join public.drivers driver on driver.id = inspection.driver_id
    join public.profiles profile on profile.id = driver.user_id
    where inspection.id = issues.inspection_id
      and inspection.driver_id = issues.driver_id
      and driver.company_id = issues.company_id
      and profile.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.inspections inspection
    join public.drivers driver on driver.id = inspection.driver_id
    join public.profiles profile on profile.id = driver.user_id
    where inspection.id = issues.inspection_id
      and inspection.driver_id = issues.driver_id
      and inspection.vehicle_id = issues.vehicle_id
      and inspection.company_id = issues.company_id
      and driver.company_id = issues.company_id
      and profile.auth_user_id = auth.uid()
  )
);
