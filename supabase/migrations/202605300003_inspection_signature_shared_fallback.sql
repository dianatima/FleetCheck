create table if not exists public.inspection_signature_fallbacks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  inspection_id uuid not null unique references public.inspections(id) on delete cascade,
  driver_id uuid references public.drivers(id) on delete set null,
  signature_data_url text not null,
  signed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists inspection_signature_fallbacks_company_idx
  on public.inspection_signature_fallbacks (company_id, signed_at desc);

create index if not exists inspection_signature_fallbacks_driver_idx
  on public.inspection_signature_fallbacks (driver_id, signed_at desc);

alter table public.inspection_signature_fallbacks enable row level security;

drop policy if exists signature_fallbacks_select_company on public.inspection_signature_fallbacks;
create policy signature_fallbacks_select_company
on public.inspection_signature_fallbacks
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as profile
    where profile.auth_user_id = auth.uid()
      and profile.company_id = inspection_signature_fallbacks.company_id
  )
);

drop policy if exists signature_fallbacks_insert_driver_company on public.inspection_signature_fallbacks;
create policy signature_fallbacks_insert_driver_company
on public.inspection_signature_fallbacks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.drivers as driver
    where driver.user_id = auth.uid()
      and driver.status in ('active', 'pending', 'new')
      and driver.company_id = inspection_signature_fallbacks.company_id
      and (inspection_signature_fallbacks.driver_id is null or inspection_signature_fallbacks.driver_id = driver.id)
  )
);

drop policy if exists signature_fallbacks_update_driver_company on public.inspection_signature_fallbacks;
create policy signature_fallbacks_update_driver_company
on public.inspection_signature_fallbacks
for update
to authenticated
using (
  exists (
    select 1
    from public.drivers as driver
    where driver.user_id = auth.uid()
      and driver.status in ('active', 'pending', 'new')
      and driver.company_id = inspection_signature_fallbacks.company_id
      and (inspection_signature_fallbacks.driver_id is null or inspection_signature_fallbacks.driver_id = driver.id)
  )
)
with check (
  exists (
    select 1
    from public.drivers as driver
    where driver.user_id = auth.uid()
      and driver.status in ('active', 'pending', 'new')
      and driver.company_id = inspection_signature_fallbacks.company_id
      and (inspection_signature_fallbacks.driver_id is null or inspection_signature_fallbacks.driver_id = driver.id)
  )
);
