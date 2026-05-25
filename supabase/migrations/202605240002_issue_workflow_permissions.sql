alter table public.issues enable row level security;

alter table public.repairs
add column if not exists company_id uuid references public.companies (id) on delete cascade,
add column if not exists vehicle_id uuid references public.vehicles (id) on delete cascade,
add column if not exists issue_id uuid references public.issues (id) on delete set null,
add column if not exists title text,
add column if not exists description text,
add column if not exists status text not null default 'open';

drop policy if exists issues_driver_update_own_inspection on public.issues;

drop policy if exists issues_driver_insert_from_own_inspection on public.issues;
create policy issues_driver_insert_from_own_inspection
on public.issues
for insert
to authenticated
with check (
  exists (
    select 1
    from public.drivers driver
    left join public.profiles profile on profile.id = driver.user_id
    where driver.id = issues.driver_id
      and driver.status = 'active'
      and driver.company_id = issues.company_id
      and (
        driver.user_id = auth.uid()
        or profile.auth_user_id = auth.uid()
      )
  )
  and exists (
    select 1
    from public.inspections inspection
    where inspection.id = issues.inspection_id
      and inspection.driver_id = issues.driver_id
      and inspection.vehicle_id = issues.vehicle_id
      and inspection.company_id = issues.company_id
  )
);

drop policy if exists issues_driver_select_own_inspection on public.issues;
create policy issues_driver_select_own_inspection
on public.issues
for select
to authenticated
using (
  exists (
    select 1
    from public.drivers driver
    left join public.profiles profile on profile.id = driver.user_id
    where driver.id = issues.driver_id
      and driver.company_id = issues.company_id
      and (
        driver.user_id = auth.uid()
        or profile.auth_user_id = auth.uid()
      )
  )
);
