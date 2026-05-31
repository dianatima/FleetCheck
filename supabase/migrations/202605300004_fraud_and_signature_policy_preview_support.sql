-- Allow owner/manager accounts in the same company to write anti-fraud and signature fallback rows.
-- This is required for DEV Driver Preview mode where auth.uid() belongs to owner,
-- but inspection driver_id points to a driver record.

-- =========================
-- inspection_photo_verifications
-- =========================

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

-- =========================
-- inspection_signature_fallbacks
-- =========================

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
