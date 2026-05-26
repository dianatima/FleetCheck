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
