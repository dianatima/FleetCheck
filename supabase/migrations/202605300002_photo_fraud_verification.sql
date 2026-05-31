create table if not exists public.inspection_photo_verifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  inspection_result_id uuid not null references public.inspection_results(id) on delete cascade,
  driver_id uuid references public.drivers(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  photo_index integer not null,
  photo_url text,
  file_name text,
  file_size_bytes bigint,
  mime_type text,
  uploaded_at timestamptz not null default now(),
  exif jsonb,
  exif_taken_at timestamptz,
  exif_device_make text,
  exif_device_model text,
  exif_software text,
  gps_latitude double precision,
  gps_longitude double precision,
  sha256 text,
  d_hash text,
  exact_duplicate_of_id uuid references public.inspection_photo_verifications(id) on delete set null,
  visual_duplicate_of_id uuid references public.inspection_photo_verifications(id) on delete set null,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  risk_level text not null default 'ok' check (risk_level in ('ok', 'needs-review', 'suspicious', 'high-risk')),
  verification_status text not null default 'ok' check (verification_status in ('ok', 'needs-review', 'suspicious', 'high-risk')),
  flags text[] not null default '{}',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (inspection_result_id, photo_index)
);

create index if not exists inspection_photo_verifications_inspection_idx
  on public.inspection_photo_verifications (inspection_id);

create index if not exists inspection_photo_verifications_driver_idx
  on public.inspection_photo_verifications (driver_id, uploaded_at desc);

create index if not exists inspection_photo_verifications_vehicle_idx
  on public.inspection_photo_verifications (vehicle_id, uploaded_at desc);

create index if not exists inspection_photo_verifications_company_sha_idx
  on public.inspection_photo_verifications (company_id, sha256);

create index if not exists inspection_photo_verifications_company_dhash_idx
  on public.inspection_photo_verifications (company_id, d_hash);

alter table public.inspection_photo_verifications enable row level security;

drop policy if exists photo_verifications_select_company on public.inspection_photo_verifications;
create policy photo_verifications_select_company
on public.inspection_photo_verifications
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as profile
    where profile.auth_user_id = auth.uid()
      and profile.company_id = inspection_photo_verifications.company_id
  )
);

drop policy if exists photo_verifications_insert_driver_company on public.inspection_photo_verifications;
create policy photo_verifications_insert_driver_company
on public.inspection_photo_verifications
for insert
to authenticated
with check (
  exists (
    select 1
    from public.drivers as driver
    where driver.user_id = auth.uid()
      and driver.status in ('active', 'pending', 'new')
      and driver.company_id = inspection_photo_verifications.company_id
      and (inspection_photo_verifications.driver_id is null or inspection_photo_verifications.driver_id = driver.id)
  )
);

drop policy if exists photo_verifications_update_manager on public.inspection_photo_verifications;
create policy photo_verifications_update_manager
on public.inspection_photo_verifications
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles as profile
    where profile.auth_user_id = auth.uid()
      and profile.company_id = inspection_photo_verifications.company_id
      and profile.role in ('owner', 'manager')
  )
)
with check (
  exists (
    select 1
    from public.profiles as profile
    where profile.auth_user_id = auth.uid()
      and profile.company_id = inspection_photo_verifications.company_id
      and profile.role in ('owner', 'manager')
  )
);
