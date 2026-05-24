-- FleetCheck multi-company schema rollout
-- Additive migration: keeps legacy profiles.company_id for backwards compatibility.

create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  driver_invite_code text unique,
  country text,
  state text,
  city text,
  address text,
  phone text,
  industry text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.companies
  add column if not exists driver_invite_code text;

create index if not exists companies_name_idx on public.companies(name);
create index if not exists companies_status_idx on public.companies(status);
create index if not exists companies_driver_invite_code_idx on public.companies(driver_invite_code);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  role text not null check (role in ('owner', 'driver')),
  first_name text,
  last_name text,
  email text,
  phone text,
  avatar_url text,
  signature_url text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists signature_url text;

create index if not exists profiles_company_id_idx on public.profiles(company_id);
create index if not exists profiles_role_idx on public.profiles(role);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit text not null,
  type text not null,
  make text not null,
  model text not null,
  year integer,
  plate text not null,
  vin text,
  odometer numeric,
  engine_hours numeric,
  status text not null default 'active',
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicles_company_id_idx on public.vehicles(company_id);
create index if not exists vehicles_status_idx on public.vehicles(status);
create index if not exists vehicles_created_at_idx on public.vehicles(created_at desc);

create table if not exists public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  role text not null check (role in ('owner', 'driver', 'manager', 'inspector', 'mechanic')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, company_id, role)
);

create index if not exists company_memberships_user_id_idx on public.company_memberships(user_id);
create index if not exists company_memberships_company_id_idx on public.company_memberships(company_id);

create table if not exists public.company_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('driver')),
  code text not null unique,
  email text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists company_invites_company_id_idx on public.company_invites(company_id);
create index if not exists company_invites_code_idx on public.company_invites(code);
create index if not exists company_invites_status_idx on public.company_invites(status);

alter table public.vehicles
  add column if not exists availability_status text not null default 'available'
    check (availability_status in ('available', 'busy', 'maintenance')),
  add column if not exists active_company_name text,
  add column if not exists active_driver_name text,
  add column if not exists active_service_type text,
  add column if not exists active_assignment_label text;

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  birthday date,
  address text,
  emergency_name text,
  emergency_phone text,
  license_no text not null,
  license_class text not null,
  license_expiry date,
  license_photo_url text,
  med_card_no text,
  med_card_expiry date,
  med_card_photo_url text,
  hire_date date,
  status text not null default 'active' check (status in ('active', 'pending', 'inactive')),
  availability_status text not null default 'available' check (availability_status in ('available', 'busy')),
  active_company_name text,
  active_vehicle_name text,
  active_service_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.drivers
  add column if not exists license_photo_url text,
  add column if not exists med_card_photo_url text;

create index if not exists drivers_owner_user_id_idx on public.drivers(owner_user_id);
create index if not exists drivers_auth_user_id_idx on public.drivers(auth_user_id);
create index if not exists drivers_availability_status_idx on public.drivers(availability_status);
create unique index if not exists drivers_auth_user_unique_idx
  on public.drivers(auth_user_id)
  where auth_user_id is not null;

insert into storage.buckets (id, name, public)
values ('driver-documents', 'driver-documents', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', true)
on conflict (id) do nothing;

drop policy if exists "Driver documents are public" on storage.objects;
create policy "Driver documents are public"
on storage.objects for select
using (bucket_id = 'driver-documents');

drop policy if exists "Authenticated users can upload driver documents" on storage.objects;
create policy "Authenticated users can upload driver documents"
on storage.objects for insert
to authenticated
with check (bucket_id = 'driver-documents');

drop policy if exists "Authenticated users can update driver documents" on storage.objects;
create policy "Authenticated users can update driver documents"
on storage.objects for update
to authenticated
using (bucket_id = 'driver-documents')
with check (bucket_id = 'driver-documents');

drop policy if exists "Authenticated users can delete driver documents" on storage.objects;
create policy "Authenticated users can delete driver documents"
on storage.objects for delete
to authenticated
using (bucket_id = 'driver-documents');

drop policy if exists "Vehicle photos are public" on storage.objects;
create policy "Vehicle photos are public"
on storage.objects for select
using (bucket_id = 'vehicle-photos');

drop policy if exists "Authenticated users can upload vehicle photos" on storage.objects;
create policy "Authenticated users can upload vehicle photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'vehicle-photos');

drop policy if exists "Authenticated users can update vehicle photos" on storage.objects;
create policy "Authenticated users can update vehicle photos"
on storage.objects for update
to authenticated
using (bucket_id = 'vehicle-photos')
with check (bucket_id = 'vehicle-photos');

drop policy if exists "Authenticated users can delete vehicle photos" on storage.objects;
create policy "Authenticated users can delete vehicle photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'vehicle-photos');

create table if not exists public.driver_company_assignments (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  status text not null default 'available' check (status in ('available', 'busy', 'inactive')),
  assigned_vehicle_id uuid references public.vehicles(id) on delete set null,
  started_at timestamptz,
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists driver_company_assignments_driver_company_idx
  on public.driver_company_assignments(driver_id, company_id);

create table if not exists public.vehicle_company_assignments (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  status text not null default 'available' check (status in ('available', 'busy', 'maintenance')),
  assigned_driver_id uuid references public.drivers(id) on delete set null,
  service_type text,
  started_at timestamptz,
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists vehicle_company_assignments_vehicle_company_idx
  on public.vehicle_company_assignments(vehicle_id, company_id);

create table if not exists public.operations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  driver_id uuid references public.drivers(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  service_type text not null,
  status text not null default 'active' check (status in ('planned', 'active', 'completed', 'cancelled')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists operations_company_id_idx on public.operations(company_id);
create index if not exists operations_driver_id_idx on public.operations(driver_id);
create index if not exists operations_vehicle_id_idx on public.operations(vehicle_id);
create index if not exists operations_status_idx on public.operations(status);

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  operation_id uuid references public.operations(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  driver_id uuid references public.drivers(id) on delete set null,
  performed_by_user_id uuid not null references auth.users(id) on delete cascade,
  inspection_type text not null check (inspection_type in ('pre-trip', 'post-trip')),
  result text not null check (result in ('pass', 'fail')),
  vehicle_odometer numeric,
  vehicle_engine_hours numeric,
  distance_unit text,
  dimension_unit text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.inspections add column if not exists responses jsonb not null default '[]'::jsonb;
alter table public.inspections add column if not exists vehicle_odometer numeric;
alter table public.inspections add column if not exists vehicle_engine_hours numeric;
alter table public.inspections add column if not exists distance_unit text;
alter table public.inspections add column if not exists dimension_unit text;
alter table public.inspections add column if not exists signature_url text;

create index if not exists inspections_company_id_idx on public.inspections(company_id);
create index if not exists inspections_operation_id_idx on public.inspections(operation_id);
create index if not exists inspections_vehicle_id_idx on public.inspections(vehicle_id);
create index if not exists inspections_driver_id_idx on public.inspections(driver_id);

create table if not exists public.inspection_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  vehicle_type text not null,
  inspection_type text not null default 'pre-trip' check (inspection_type in ('pre-trip', 'post-trip')),
  is_active boolean not null default true,
  distance_unit text not null default 'km',
  dimension_unit text not null default 'm',
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inspection_templates add column if not exists distance_unit text not null default 'km';
alter table public.inspection_templates add column if not exists dimension_unit text not null default 'm';

create index if not exists inspection_templates_company_id_idx on public.inspection_templates(company_id);
create index if not exists inspection_templates_vehicle_type_idx on public.inspection_templates(vehicle_type);
create index if not exists inspection_templates_inspection_type_idx on public.inspection_templates(inspection_type);

alter table public.company_memberships enable row level security;
alter table public.profiles enable row level security;
alter table public.drivers enable row level security;
alter table public.driver_company_assignments enable row level security;
alter table public.vehicle_company_assignments enable row level security;
alter table public.inspection_templates enable row level security;

drop policy if exists "Authenticated users can manage company memberships" on public.company_memberships;
create policy "Authenticated users can manage company memberships"
on public.company_memberships for all
to authenticated
using (true)
with check (true);

drop policy if exists "Users can read their own profile or owners can read company driver profiles" on public.profiles;
create policy "Users can read their own profile or owners can read company driver profiles"
on public.profiles for select
to authenticated
using (
  auth.uid() = auth_user_id
  or exists (
    select 1
    from public.company_memberships owner_membership
    where owner_membership.user_id = auth.uid()
      and owner_membership.company_id = profiles.company_id
      and owner_membership.role = 'owner'
  )
);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = auth_user_id);

drop policy if exists "Users can update their own profile or owners can update company driver profiles" on public.profiles;
create policy "Users can update their own profile or owners can update company driver profiles"
on public.profiles for update
to authenticated
using (
  auth.uid() = auth_user_id
  or exists (
    select 1
    from public.company_memberships owner_membership
    where owner_membership.user_id = auth.uid()
      and owner_membership.company_id = profiles.company_id
      and owner_membership.role = 'owner'
  )
)
with check (
  auth.uid() = auth_user_id
  or exists (
    select 1
    from public.company_memberships owner_membership
    where owner_membership.user_id = auth.uid()
      and owner_membership.company_id = profiles.company_id
      and owner_membership.role = 'owner'
  )
);

drop policy if exists "Company members can read inspection templates" on public.inspection_templates;
create policy "Company members can read inspection templates"
on public.inspection_templates for select
to authenticated
using (
  exists (
    select 1
    from public.company_memberships membership
    where membership.user_id = auth.uid()
      and membership.company_id = inspection_templates.company_id
  )
);

drop policy if exists "Owners managers inspectors can manage inspection templates" on public.inspection_templates;
create policy "Owners managers inspectors can manage inspection templates"
on public.inspection_templates for all
to authenticated
using (
  exists (
    select 1
    from public.company_memberships membership
    where membership.user_id = auth.uid()
      and membership.company_id = inspection_templates.company_id
      and membership.role in ('owner', 'manager', 'inspector')
  )
)
with check (
  exists (
    select 1
    from public.company_memberships membership
    where membership.user_id = auth.uid()
      and membership.company_id = inspection_templates.company_id
      and membership.role in ('owner', 'manager', 'inspector')
  )
);

drop policy if exists "Drivers can read their row and owners can read company drivers" on public.drivers;
create policy "Drivers can read their row and owners can read company drivers"
on public.drivers for select
to authenticated
using (
  auth.uid() = auth_user_id
  or exists (
    select 1
    from public.company_memberships owner_membership
    join public.company_memberships driver_membership
      on driver_membership.user_id = drivers.auth_user_id
     and driver_membership.company_id = owner_membership.company_id
     and driver_membership.role = 'driver'
    where owner_membership.user_id = auth.uid()
      and owner_membership.role = 'owner'
  )
);

drop policy if exists "Drivers can insert their own row" on public.drivers;
create policy "Drivers can insert their own row"
on public.drivers for insert
to authenticated
with check (auth.uid() = auth_user_id);

drop policy if exists "Drivers can update their row and owners can update company drivers" on public.drivers;
create policy "Drivers can update their row and owners can update company drivers"
on public.drivers for update
to authenticated
using (
  auth.uid() = auth_user_id
  or exists (
    select 1
    from public.company_memberships owner_membership
    join public.company_memberships driver_membership
      on driver_membership.user_id = drivers.auth_user_id
     and driver_membership.company_id = owner_membership.company_id
     and driver_membership.role = 'driver'
    where owner_membership.user_id = auth.uid()
      and owner_membership.role = 'owner'
  )
)
with check (
  auth.uid() = auth_user_id
  or exists (
    select 1
    from public.company_memberships owner_membership
    join public.company_memberships driver_membership
      on driver_membership.user_id = drivers.auth_user_id
     and driver_membership.company_id = owner_membership.company_id
     and driver_membership.role = 'driver'
    where owner_membership.user_id = auth.uid()
      and owner_membership.role = 'owner'
  )
);

drop policy if exists "Company members can read driver assignments" on public.driver_company_assignments;
create policy "Company members can read driver assignments"
on public.driver_company_assignments for select
to authenticated
using (
  exists (
    select 1
    from public.company_memberships membership
    where membership.user_id = auth.uid()
      and membership.company_id = driver_company_assignments.company_id
  )
);

drop policy if exists "Company owners can manage driver assignments" on public.driver_company_assignments;
create policy "Company owners can manage driver assignments"
on public.driver_company_assignments for all
to authenticated
using (
  exists (
    select 1
    from public.company_memberships membership
    where membership.user_id = auth.uid()
      and membership.company_id = driver_company_assignments.company_id
      and membership.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.company_memberships membership
    where membership.user_id = auth.uid()
      and membership.company_id = driver_company_assignments.company_id
      and membership.role = 'owner'
  )
);

drop policy if exists "Company members can read vehicle assignments" on public.vehicle_company_assignments;
create policy "Company members can read vehicle assignments"
on public.vehicle_company_assignments for select
to authenticated
using (
  exists (
    select 1
    from public.company_memberships membership
    where membership.user_id = auth.uid()
      and membership.company_id = vehicle_company_assignments.company_id
  )
);

drop policy if exists "Company owners and managers can manage vehicle assignments" on public.vehicle_company_assignments;
drop policy if exists "Company owners can manage vehicle assignments" on public.vehicle_company_assignments;
create policy "Company owners and managers can manage vehicle assignments"
on public.vehicle_company_assignments for all
to authenticated
using (
  exists (
    select 1
    from public.company_memberships membership
    where membership.user_id = auth.uid()
      and membership.company_id = vehicle_company_assignments.company_id
      and membership.role in ('owner', 'manager')
  )
)
with check (
  exists (
    select 1
    from public.company_memberships membership
    where membership.user_id = auth.uid()
      and membership.company_id = vehicle_company_assignments.company_id
      and membership.role in ('owner', 'manager')
  )
);

-- Example RLS idea:
-- allow read/write when auth.uid() is a member of the same company via company_memberships.
-- Keep profiles.company_id until all frontend reads are moved to company_memberships/current company context.
