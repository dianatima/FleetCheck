alter table public.inspection_templates
add column if not exists engine_hours_required boolean not null default false;