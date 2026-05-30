-- Allow active drivers to update odometer/engine_hours on vehicles in their own company.
-- This keeps the current vehicle snapshot in sync after inspection submit.

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
