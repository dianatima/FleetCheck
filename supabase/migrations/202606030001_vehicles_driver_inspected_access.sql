-- Allow a driver to read vehicles they have performed inspections on.
-- The existing `vehicles_active_driver_allowed_types` policy only allows
-- drivers to see vehicles they are currently eligible to drive.
-- After a trip ends (assignment closed), the vehicle is no longer visible,
-- so the inspection header shows "—" for vehicle/odometer.
-- This policy adds read access to any vehicle linked to the driver's inspections.

drop policy if exists vehicles_driver_inspected_vehicle on public.vehicles;
create policy vehicles_driver_inspected_vehicle
on public.vehicles
for select
using (
  exists (
    select 1
    from public.inspections as i
    join public.drivers as d on d.id = i.driver_id
    join public.profiles as p on p.id = d.user_id
    where i.vehicle_id = vehicles.id
      and p.auth_user_id = auth.uid()
  )
);
