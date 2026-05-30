-- Company-scoped inspection templates and checklist items.
-- Template vehicle type assignment is normalized through vehicle_types.id.

create table if not exists public.inspection_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  vehicle_type_id uuid not null references public.vehicle_types (id),
  name text not null,
  description text,
  inspection_mode text not null default 'pre-trip',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inspection_templates
  add column if not exists company_id uuid references public.companies (id) on delete cascade,
  add column if not exists vehicle_type_id uuid references public.vehicle_types (id),
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists inspection_mode text not null default 'pre-trip',
  add column if not exists is_default boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.inspection_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.inspection_templates (id) on delete cascade,
  title text not null,
  description text,
  category text,
  is_required boolean not null default true,
  requires_photo boolean not null default false,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inspection_template_items
  add column if not exists template_id uuid references public.inspection_templates (id) on delete cascade,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists is_required boolean not null default true,
  add column if not exists requires_photo boolean not null default false,
  add column if not exists sort_order integer not null default 1,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists inspection_templates_company_id_idx
  on public.inspection_templates (company_id);

create index if not exists inspection_templates_vehicle_type_id_idx
  on public.inspection_templates (vehicle_type_id);

create unique index if not exists inspection_templates_company_vehicle_type_mode_unique_idx
  on public.inspection_templates (company_id, vehicle_type_id, inspection_mode);

create index if not exists inspection_template_items_template_order_idx
  on public.inspection_template_items (template_id, sort_order);

alter table public.inspection_templates enable row level security;
alter table public.inspection_template_items enable row level security;

drop policy if exists inspection_templates_company_managers on public.inspection_templates;
create policy inspection_templates_company_managers
on public.inspection_templates
for all
using (
  exists (
    select 1
    from public.profiles as profile
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = inspection_templates.company_id
    where profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = inspection_templates.company_id
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
      and owner.company_id = inspection_templates.company_id
    where profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = inspection_templates.company_id
          and profile.role::text in ('owner', 'manager', 'admin')
        )
      )
  )
);

drop policy if exists inspection_template_items_company_managers on public.inspection_template_items;
create policy inspection_template_items_company_managers
on public.inspection_template_items
for all
using (
  exists (
    select 1
    from public.inspection_templates as template
    join public.profiles as profile on true
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = template.company_id
    where template.id = inspection_template_items.template_id
      and profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = template.company_id
          and profile.role::text in ('owner', 'manager', 'admin')
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.inspection_templates as template
    join public.profiles as profile on true
    left join public.company_owners as owner
      on owner.profile_id = profile.id
      and owner.company_id = template.company_id
    where template.id = inspection_template_items.template_id
      and profile.auth_user_id = auth.uid()
      and (
        owner.company_id is not null
        or (
          profile.company_id = template.company_id
          and profile.role::text in ('owner', 'manager', 'admin')
        )
      )
  )
);
