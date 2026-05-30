alter table public.inspections
  add column if not exists signature_data_url text,
  add column if not exists signed_at timestamptz,
  add column if not exists signed_by_driver_id uuid references public.drivers (id) on delete set null;

-- Refresh PostgREST schema cache so new columns are visible immediately.
do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception
  when others then
    -- Ignore if notify channel is not available in this environment.
    null;
end $$;
