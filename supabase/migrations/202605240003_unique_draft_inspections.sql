create unique index if not exists inspections_one_draft_per_driver_vehicle_type_idx
on public.inspections (driver_id, vehicle_id, type)
where status = 'draft';
