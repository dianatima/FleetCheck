alter table public.inspection_templates
  add column if not exists inspection_mode text not null default 'pre-trip';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'inspection_templates_inspection_mode_check'
  ) then
    alter table public.inspection_templates
      add constraint inspection_templates_inspection_mode_check
      check (inspection_mode in ('pre-trip', 'post-trip', 'custom'));
  end if;
end $$;

update public.inspection_templates
set inspection_mode = case
  when description ilike '%[[inspection-mode:post-trip]]%' then 'post-trip'
  when description ilike '%[[inspection-mode:custom]]%' then 'custom'
  else 'pre-trip'
end
where inspection_mode is null
   or inspection_mode not in ('pre-trip', 'post-trip', 'custom');

drop index if exists public.inspection_templates_company_vehicle_type_unique_idx;
drop index if exists public.inspection_templates_default_vehicle_type_idx;

do $$
declare
  idx record;
begin
  for idx in
    select
      schemaname,
      indexname
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'inspection_templates'
      and indexdef ilike 'create unique index%on public.inspection_templates% (company_id, vehicle_type_id)%'
      and indexdef not ilike '%inspection_mode%'
  loop
    execute format('drop index if exists %I.%I', idx.schemaname, idx.indexname);
  end loop;
end $$;

alter table public.inspection_templates
  drop constraint if exists inspection_templates_company_vehicle_type_key;

update public.inspection_templates
set is_default = (inspection_mode = 'pre-trip')
where is_default is distinct from (inspection_mode = 'pre-trip');

create unique index if not exists inspection_templates_company_vehicle_type_mode_unique_idx
  on public.inspection_templates (company_id, vehicle_type_id, inspection_mode);