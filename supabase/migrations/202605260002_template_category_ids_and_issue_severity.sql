alter table public.inspection_template_items
add column if not exists category_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'inspection_template_items_category_id_fkey'
      and conrelid = 'public.inspection_template_items'::regclass
  ) then
    alter table public.inspection_template_items
    add constraint inspection_template_items_category_id_fkey
    foreign key (category_id)
    references public.inspection_item_categories (id)
    on delete restrict
    not valid;
  end if;
end $$;

alter table public.issues
add column if not exists severity text not null default 'medium';

update public.issues
set severity = 'medium'
where severity is null
   or severity not in ('low', 'medium', 'high');

alter table public.issues
alter column severity set default 'medium',
alter column severity set not null;

alter table public.issues
drop constraint if exists issues_severity_check;

alter table public.issues
add constraint issues_severity_check
check (severity in ('low', 'medium', 'high'));

-- Optional helper for one-time backfill of existing issue severities:
-- update public.issues as issue
-- set severity = coalesce(category.severity, 'medium')
-- from public.inspection_results as result
-- join public.inspection_template_items as item
--   on item.id = result.template_item_id
-- left join public.inspection_item_categories as category
--   on category.id = item.category_id
-- where result.id = issue.inspection_result_id;
