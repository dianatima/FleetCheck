alter table public.inspection_results
add column if not exists comment text,
add column if not exists photo_urls text[] default '{}';

alter table public.inspection_results
alter column result drop not null,
alter column result drop default;

alter table public.inspection_results
drop constraint if exists inspection_results_result_check;

alter table public.inspection_results
add constraint inspection_results_result_check
check (result is null or result in ('pass', 'fail', 'not_applicable'));

alter table public.inspections
add column if not exists submitted_at timestamptz;

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete cascade,
  driver_id uuid references public.drivers (id) on delete set null,
  inspection_id uuid references public.inspections (id) on delete cascade,
  inspection_result_id uuid references public.inspection_results (id) on delete cascade,
  title text,
  description text,
  status text not null default 'open',
  photo_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.issues
add column if not exists company_id uuid references public.companies (id) on delete cascade,
add column if not exists vehicle_id uuid references public.vehicles (id) on delete cascade,
add column if not exists driver_id uuid references public.drivers (id) on delete set null,
add column if not exists inspection_id uuid references public.inspections (id) on delete cascade,
add column if not exists inspection_result_id uuid references public.inspection_results (id) on delete cascade,
add column if not exists title text,
add column if not exists description text,
add column if not exists status text not null default 'open',
add column if not exists photo_urls text[] not null default '{}',
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

create unique index if not exists issues_inspection_result_id_idx
on public.issues (inspection_result_id);

alter table public.issues enable row level security;

drop policy if exists issues_active_driver_own on public.issues;
create policy issues_active_driver_own
on public.issues
for all
to authenticated
using (
  exists (
    select 1
    from public.drivers driver
    join public.profiles profile on profile.id = driver.user_id
    where driver.id = issues.driver_id
      and driver.status = 'active'
      and profile.auth_user_id = auth.uid()
      and driver.company_id = issues.company_id
  )
)
with check (
  exists (
    select 1
    from public.drivers driver
    join public.profiles profile on profile.id = driver.user_id
    where driver.id = issues.driver_id
      and driver.status = 'active'
      and profile.auth_user_id = auth.uid()
      and driver.company_id = issues.company_id
  )
);

drop policy if exists issues_company_managers_all on public.issues;
create policy issues_company_managers_all
on public.issues
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles profile
    left join public.company_owners owner
      on owner.profile_id = profile.id
      and owner.company_id = issues.company_id
    where profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = issues.company_id
          and profile.role in ('owner', 'manager', 'admin')
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles profile
    left join public.company_owners owner
      on owner.profile_id = profile.id
      and owner.company_id = issues.company_id
    where profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = issues.company_id
          and profile.role in ('owner', 'manager', 'admin')
        )
      )
  )
);
