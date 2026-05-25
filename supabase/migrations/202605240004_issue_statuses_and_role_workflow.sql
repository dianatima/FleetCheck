update public.issues
set status = 'under-review'
where status is null
  or status = 'open';

alter table public.issues
alter column status set default 'under-review';

alter table public.issues
drop constraint if exists issues_status_check;

alter table public.issues
add constraint issues_status_check
check (status in ('under-review', 'in-repair', 'fixed', 'rejected'));

alter table public.issues enable row level security;

drop policy if exists issues_active_driver_own on public.issues;
drop policy if exists issues_driver_update_own_inspection on public.issues;
drop policy if exists issues_driver_insert_from_own_inspection on public.issues;
create policy issues_driver_insert_from_own_inspection
on public.issues
for insert
to authenticated
with check (
  status = 'under-review'
  and exists (
    select 1
    from public.drivers as driver
    left join public.profiles as profile
      on profile.id = driver.user_id
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
    from public.inspections as inspection
    where inspection.id = issues.inspection_id
      and inspection.driver_id = issues.driver_id
      and inspection.vehicle_id = issues.vehicle_id
      and inspection.company_id = issues.company_id
  )
  and exists (
    select 1
    from public.inspection_results as result
    where result.id = issues.inspection_result_id
      and result.inspection_id = issues.inspection_id
      and result.result = 'fail'
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
    from public.drivers as driver
    left join public.profiles as profile
      on profile.id = driver.user_id
    where driver.id = issues.driver_id
      and driver.company_id = issues.company_id
      and (
        driver.user_id = auth.uid()
        or profile.auth_user_id = auth.uid()
      )
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
    from public.profiles as profile
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = issues.company_id
    where profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = issues.company_id
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
      and owner.company_id = issues.company_id
    where profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = issues.company_id
          and profile.role::text in ('owner', 'manager', 'admin')
        )
      )
  )
);

alter table public.repairs enable row level security;

drop policy if exists repairs_company_managers_all on public.repairs;
create policy repairs_company_managers_all
on public.repairs
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles as profile
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = repairs.company_id
    where profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = repairs.company_id
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
      and owner.company_id = repairs.company_id
    where profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = repairs.company_id
          and profile.role::text in ('owner', 'manager', 'admin')
        )
      )
  )
);
