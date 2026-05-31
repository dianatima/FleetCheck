-- PRODUCTION HOTFIX
-- Applies schema + RLS fixes for manager/owner/admin + company_owners access.

-- 1) Ensure inspections signature columns exist.
alter table public.inspections
  add column if not exists signature_data_url text,
  add column if not exists signed_at timestamptz,
  add column if not exists signed_by_driver_id uuid references public.drivers (id) on delete set null;

-- 2) Ensure RLS is enabled for target tables.
alter table public.inspection_photo_verifications enable row level security;
alter table public.inspection_signature_fallbacks enable row level security;

-- 3) Recreate anti-fraud policies.
drop policy if exists photo_verifications_select_company on public.inspection_photo_verifications;
create policy photo_verifications_select_company
on public.inspection_photo_verifications
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as profile
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = inspection_photo_verifications.company_id
    where profile.auth_user_id = auth.uid()
      and (
        (profile.company_id = inspection_photo_verifications.company_id and profile.role::text in ('owner', 'manager', 'admin'))
        or owner.profile_id is not null
      )
  )
);

drop policy if exists photo_verifications_insert_driver_company on public.inspection_photo_verifications;
create policy photo_verifications_insert_driver_company
on public.inspection_photo_verifications
for insert
to authenticated
with check (
  (
    exists (
      select 1
      from public.drivers as driver
      where driver.user_id = auth.uid()
        and driver.status in ('active', 'pending', 'new')
        and driver.company_id = inspection_photo_verifications.company_id
        and (
          inspection_photo_verifications.driver_id is null
          or inspection_photo_verifications.driver_id = driver.id
        )
    )
  )
  or
  (
    exists (
      select 1
      from public.profiles as profile
      left join public.company_owners as owner
        on owner.profile_id = profile.id
        and owner.company_id = inspection_photo_verifications.company_id
      where profile.auth_user_id = auth.uid()
        and (
          (profile.company_id = inspection_photo_verifications.company_id and profile.role::text in ('owner', 'manager', 'admin'))
          or owner.profile_id is not null
        )
    )
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
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = inspection_photo_verifications.company_id
    where profile.auth_user_id = auth.uid()
      and (
        (profile.company_id = inspection_photo_verifications.company_id and profile.role::text in ('owner', 'manager', 'admin'))
        or owner.profile_id is not null
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles as profile
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = inspection_photo_verifications.company_id
    where profile.auth_user_id = auth.uid()
      and (
        (profile.company_id = inspection_photo_verifications.company_id and profile.role::text in ('owner', 'manager', 'admin'))
        or owner.profile_id is not null
      )
  )
);

-- 4) Recreate signature fallback policies.
drop policy if exists signature_fallbacks_select_company on public.inspection_signature_fallbacks;
create policy signature_fallbacks_select_company
on public.inspection_signature_fallbacks
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as profile
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = inspection_signature_fallbacks.company_id
    where profile.auth_user_id = auth.uid()
      and (
        (profile.company_id = inspection_signature_fallbacks.company_id and profile.role::text in ('owner', 'manager', 'admin'))
        or owner.profile_id is not null
      )
  )
);

drop policy if exists signature_fallbacks_insert_driver_company on public.inspection_signature_fallbacks;
create policy signature_fallbacks_insert_driver_company
on public.inspection_signature_fallbacks
for insert
to authenticated
with check (
  (
    exists (
      select 1
      from public.drivers as driver
      where driver.user_id = auth.uid()
        and driver.status in ('active', 'pending', 'new')
        and driver.company_id = inspection_signature_fallbacks.company_id
        and (
          inspection_signature_fallbacks.driver_id is null
          or inspection_signature_fallbacks.driver_id = driver.id
        )
    )
  )
  or
  (
    exists (
      select 1
      from public.profiles as profile
      left join public.company_owners as owner
        on owner.profile_id = profile.id
        and owner.company_id = inspection_signature_fallbacks.company_id
      where profile.auth_user_id = auth.uid()
        and (
          (profile.company_id = inspection_signature_fallbacks.company_id and profile.role::text in ('owner', 'manager', 'admin'))
          or owner.profile_id is not null
        )
    )
  )
);

drop policy if exists signature_fallbacks_update_driver_company on public.inspection_signature_fallbacks;
create policy signature_fallbacks_update_driver_company
on public.inspection_signature_fallbacks
for update
to authenticated
using (
  (
    exists (
      select 1
      from public.drivers as driver
      where driver.user_id = auth.uid()
        and driver.status in ('active', 'pending', 'new')
        and driver.company_id = inspection_signature_fallbacks.company_id
        and (
          inspection_signature_fallbacks.driver_id is null
          or inspection_signature_fallbacks.driver_id = driver.id
        )
    )
  )
  or
  (
    exists (
      select 1
      from public.profiles as profile
      left join public.company_owners as owner
        on owner.profile_id = profile.id
        and owner.company_id = inspection_signature_fallbacks.company_id
      where profile.auth_user_id = auth.uid()
        and (
          (profile.company_id = inspection_signature_fallbacks.company_id and profile.role::text in ('owner', 'manager', 'admin'))
          or owner.profile_id is not null
        )
    )
  )
)
with check (
  (
    exists (
      select 1
      from public.drivers as driver
      where driver.user_id = auth.uid()
        and driver.status in ('active', 'pending', 'new')
        and driver.company_id = inspection_signature_fallbacks.company_id
        and (
          inspection_signature_fallbacks.driver_id is null
          or inspection_signature_fallbacks.driver_id = driver.id
        )
    )
  )
  or
  (
    exists (
      select 1
      from public.profiles as profile
      left join public.company_owners as owner
        on owner.profile_id = profile.id
        and owner.company_id = inspection_signature_fallbacks.company_id
      where profile.auth_user_id = auth.uid()
        and (
          (profile.company_id = inspection_signature_fallbacks.company_id and profile.role::text in ('owner', 'manager', 'admin'))
          or owner.profile_id is not null
        )
    )
  )
);
