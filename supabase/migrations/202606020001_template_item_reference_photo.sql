alter table public.inspection_template_items
  add column if not exists reference_photo_url text;
