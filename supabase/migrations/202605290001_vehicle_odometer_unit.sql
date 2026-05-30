alter table public.vehicles
  add column if not exists odometer_unit text not null default 'mi';

alter table public.vehicles
  drop constraint if exists vehicles_odometer_unit_check;

alter table public.vehicles
  add constraint vehicles_odometer_unit_check
  check (odometer_unit in ('km', 'mi'));

update public.vehicles
set odometer_unit = 'mi'
where odometer_unit is null or odometer_unit not in ('km', 'mi');
