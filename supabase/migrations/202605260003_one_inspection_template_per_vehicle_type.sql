-- MVP rule: one inspection template per company + vehicle type.
-- If this migration fails with the duplicate-template exception below, resolve
-- duplicates manually first, then run it again.
--
-- Duplicate finder:
-- select
--   company_id,
--   vehicle_type_id,
--   count(*) as template_count,
--   array_agg(id order by created_at desc) as template_ids
-- from public.inspection_templates
-- group by company_id, vehicle_type_id
-- having count(*) > 1;

do $$
begin
  if exists (
    select 1
    from public.inspection_templates
    group by company_id, vehicle_type_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate inspection templates exist for the same company and vehicle type. Clean duplicates before adding the unique index.';
  end if;
end $$;

update public.inspection_templates
set is_default = true
where is_default is distinct from true;

drop index if exists public.inspection_templates_default_vehicle_type_idx;

create unique index if not exists inspection_templates_company_vehicle_type_unique_idx
on public.inspection_templates (company_id, vehicle_type_id);
