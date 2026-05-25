-- Company-scoped driver license rules for normalized vehicle types.

create table if not exists public.license_vehicle_type_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  license_class text not null,
  vehicle_type_id uuid not null references public.vehicle_types (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.license_vehicle_type_rules
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists company_id uuid references public.companies (id) on delete cascade,
  add column if not exists license_class text,
  add column if not exists vehicle_type_id uuid references public.vehicle_types (id) on delete cascade,
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists license_vehicle_type_rules_unique_rule_idx
  on public.license_vehicle_type_rules (
    company_id,
    lower(trim(license_class)),
    vehicle_type_id
  )
  where company_id is not null
    and nullif(trim(license_class), '') is not null;

create index if not exists license_vehicle_type_rules_company_class_idx
  on public.license_vehicle_type_rules (company_id, license_class);

alter table public.license_vehicle_type_rules enable row level security;

drop policy if exists license_vehicle_type_rules_company_managers
  on public.license_vehicle_type_rules;

create policy license_vehicle_type_rules_company_managers
on public.license_vehicle_type_rules
for all
using (
  exists (
    select 1
    from public.profiles as profile
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = license_vehicle_type_rules.company_id
    where profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = license_vehicle_type_rules.company_id
          and profile.role::text in ('owner', 'manager', 'admin')
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles as profile
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = license_vehicle_type_rules.company_id
    where profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = license_vehicle_type_rules.company_id
          and profile.role::text in ('owner', 'manager', 'admin')
        )
      )
  )
);
