alter table public.drivers
  add column if not exists invitation_sent_at timestamptz,
  add column if not exists invitation_accepted_at timestamptz;

alter table public.profiles
  add column if not exists password_set_at timestamptz;

alter table public.drivers
  drop constraint if exists drivers_user_id_fkey;

alter table public.drivers
  add constraint drivers_user_id_fkey
  foreign key (user_id)
  references public.profiles (id)
  on delete set null;

update public.drivers as driver
set user_id = profile.id
from public.profiles as profile
where driver.user_id is null
  and driver.invitation_accepted_at is not null
  and profile.company_id = driver.company_id
  and profile.role = 'driver'
  and lower(profile.email) = lower(driver.email);

alter table public.drivers
  alter column status set default 'new';

do $$
declare
  driver_status_constraint record;
begin
  for driver_status_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.drivers'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format(
      'alter table public.drivers drop constraint %I',
      driver_status_constraint.conname
    );
  end loop;
end $$;

alter table public.drivers
  add constraint drivers_status_check
  check (status in ('new', 'pending', 'active', 'inactive'));
