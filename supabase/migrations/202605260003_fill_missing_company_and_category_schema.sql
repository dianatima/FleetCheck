create table if not exists public.company_owners (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, company_id)
);

create index if not exists company_owners_company_idx
  on public.company_owners (company_id);

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
  )
);

insert into public.company_owners (profile_id, company_id)
select profile.id, profile.company_id
from public.profiles as profile
where profile.role::text = 'owner'
  and profile.company_id is not null
on conflict (profile_id, company_id) do nothing;

create table if not exists public.inspection_item_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  severity text not null default 'medium',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inspection_item_categories_severity_check
    check (severity in ('low', 'medium', 'high'))
);

alter table public.inspection_item_categories enable row level security;

drop policy if exists inspection_item_categories_authenticated_read on public.inspection_item_categories;
create policy inspection_item_categories_authenticated_read
on public.inspection_item_categories
for select
to authenticated
using (true);

drop policy if exists inspection_item_categories_owner_insert on public.inspection_item_categories;
create policy inspection_item_categories_owner_insert
on public.inspection_item_categories
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles as profile
    where profile.auth_user_id = auth.uid()
      and profile.role::text = 'owner'
  )
);

drop policy if exists inspection_item_categories_owner_update on public.inspection_item_categories;
create policy inspection_item_categories_owner_update
on public.inspection_item_categories
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles as profile
    where profile.auth_user_id = auth.uid()
      and profile.role::text = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.profiles as profile
    where profile.auth_user_id = auth.uid()
      and profile.role::text = 'owner'
  )
);

drop policy if exists inspection_item_categories_owner_delete on public.inspection_item_categories;
create policy inspection_item_categories_owner_delete
on public.inspection_item_categories
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles as profile
    where profile.auth_user_id = auth.uid()
      and profile.role::text = 'owner'
  )
);

alter table public.vehicles enable row level security;

drop policy if exists vehicles_company_managers_all on public.vehicles;
create policy vehicles_company_managers_all
on public.vehicles
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles as profile
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = vehicles.company_id
    where profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = vehicles.company_id
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
      and owner.company_id = vehicles.company_id
    where profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = vehicles.company_id
          and profile.role::text in ('owner', 'manager', 'admin')
        )
      )
  )
);
