alter table public.companies
add column if not exists odometer_unit text;

update public.companies
set odometer_unit = coalesce(odometer_unit, 'mi');

alter table public.companies
alter column odometer_unit set default 'mi';

alter table public.companies
drop constraint if exists companies_odometer_unit_check;

alter table public.companies
add constraint companies_odometer_unit_check
check (odometer_unit in ('mi', 'km', 'nm'));