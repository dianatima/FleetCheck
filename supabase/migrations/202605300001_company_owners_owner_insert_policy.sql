delete from public.company_owners as older
using public.company_owners as newer
where older.ctid < newer.ctid
  and older.company_id = newer.company_id
  and older.profile_id = newer.profile_id;

create unique index if not exists company_owners_company_profile_unique_idx
on public.company_owners (company_id, profile_id);

alter table public.company_owners enable row level security;

drop policy if exists company_owners_select_own on public.company_owners;
create policy company_owners_select_own
on public.company_owners
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as profile
    where profile.id = company_owners.profile_id
      and profile.auth_user_id = auth.uid()
      and profile.role::text = 'owner'
  )
);

drop policy if exists company_owners_owner_insert_own on public.company_owners;
create policy company_owners_owner_insert_own
on public.company_owners
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles as profile
    where profile.id = company_owners.profile_id
      and profile.auth_user_id = auth.uid()
      and profile.role::text = 'owner'
  )
);

drop policy if exists company_owners_owner_delete_own on public.company_owners;
create policy company_owners_owner_delete_own
on public.company_owners
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles as profile
    where profile.id = company_owners.profile_id
      and profile.auth_user_id = auth.uid()
      and profile.role::text = 'owner'
  )
);
