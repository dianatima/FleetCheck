alter table public.inspections
add column if not exists signature_data_url text,
add column if not exists signed_at timestamptz,
add column if not exists signed_by_driver_id uuid references public.drivers (id) on delete set null;