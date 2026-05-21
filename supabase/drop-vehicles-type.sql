-- Stage 2: run only after vehicle-types-normalization.sql has been applied,
-- unmatched vehicles have been fixed, and the app build is deployed.

do $$
begin
  if exists (
    select 1
    from public.vehicles
    where vehicle_type_id is null
  ) then
    raise exception
      'vehicles.type cannot be dropped while vehicles.vehicle_type_id is null';
  end if;
end
$$;

alter table public.vehicles
  alter column vehicle_type_id set not null;

alter table public.vehicles
  drop column if exists type;
