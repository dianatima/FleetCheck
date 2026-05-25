-- Clears active vehicle assignments that do not have a submitted pre-trip
-- inspection for the same driver and vehicle.
--
-- Run this once after deploying the fixed pre-trip creation flow if older
-- failed starts left vehicles incorrectly assigned.

update public.vehicle_assignments assignment
set
  status = 'cancelled',
  end_at = coalesce(assignment.end_at, now())
where assignment.status = 'active'
  and assignment.end_at is null
  and not exists (
    select 1
    from public.inspections inspection
    where inspection.driver_id = assignment.driver_id
      and inspection.vehicle_id = assignment.vehicle_id
      and inspection.type = 'pre-trip'
      and inspection.status = 'submitted'
  );
