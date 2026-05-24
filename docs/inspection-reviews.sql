create table if not exists public.inspection_reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  inspection_id uuid not null unique references public.inspections(id) on delete cascade,
  reviewed_by_user_id uuid not null references auth.users(id) on delete cascade,
  review_status text not null check (review_status in ('needs-review', 'reviewed-ok', 'reviewed-flag')),
  manager_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inspection_reviews_company_id_idx on public.inspection_reviews(company_id);
create index if not exists inspection_reviews_inspection_id_idx on public.inspection_reviews(inspection_id);
create index if not exists inspection_reviews_reviewed_by_user_id_idx on public.inspection_reviews(reviewed_by_user_id);

alter table public.inspection_reviews enable row level security;

drop policy if exists "Company members can read applicable inspection reviews" on public.inspection_reviews;
create policy "Company members can read applicable inspection reviews"
on public.inspection_reviews for select
to authenticated
using (
  exists (
    select 1
    from public.company_memberships membership
    where membership.user_id = auth.uid()
      and membership.company_id = inspection_reviews.company_id
      and membership.role in ('owner', 'manager', 'inspector', 'mechanic', 'admin', 'accountant')
  )
  or exists (
    select 1
    from public.inspections inspection
    join public.drivers driver
      on driver.id = inspection.driver_id
    where inspection.id = inspection_reviews.inspection_id
      and driver.auth_user_id = auth.uid()
  )
);

drop policy if exists "Privileged company members can manage inspection reviews" on public.inspection_reviews;
create policy "Privileged company members can manage inspection reviews"
on public.inspection_reviews for all
to authenticated
using (
  exists (
    select 1
    from public.company_memberships membership
    where membership.user_id = auth.uid()
      and membership.company_id = inspection_reviews.company_id
      and membership.role in ('owner', 'manager', 'inspector', 'admin', 'accountant')
  )
)
with check (
  exists (
    select 1
    from public.company_memberships membership
    where membership.user_id = auth.uid()
      and membership.company_id = inspection_reviews.company_id
      and membership.role in ('owner', 'manager', 'inspector', 'admin', 'accountant')
  )
);