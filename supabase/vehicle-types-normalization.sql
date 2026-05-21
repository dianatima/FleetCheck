-- Stage 1: keep vehicles.type for rollback/backfill only while the app moves to
-- the normalized vehicle_types relation.

alter table public.vehicles
  add column if not exists vehicle_type_id uuid;

update public.vehicles as vehicle
set vehicle_type_id = (
  select vehicle_type.id
  from public.vehicle_types as vehicle_type
  where lower(trim(vehicle_type.name)) = lower(trim(vehicle.type))
  limit 1
)
where vehicle.vehicle_type_id is null
  and nullif(trim(vehicle.type), '') is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vehicles_vehicle_type_id_fkey'
      and conrelid = 'public.vehicles'::regclass
  ) then
    alter table public.vehicles
      add constraint vehicles_vehicle_type_id_fkey
      foreign key (vehicle_type_id)
      references public.vehicle_types (id)
      not valid;
  end if;
end
$$;

alter table public.vehicles
  validate constraint vehicles_vehicle_type_id_fkey;

-- Review this result before enforcing vehicle_type_id as required or dropping
-- vehicles.type. Rows here need a vehicle_types row or a manual assignment.
select
  vehicle.id,
  vehicle.unit,
  vehicle.type
from public.vehicles as vehicle
where vehicle.vehicle_type_id is null;
