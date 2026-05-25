create or replace function public.sync_vehicle_status_from_issue()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  unresolved_count integer;
begin
  if new.vehicle_id is null then
    return new;
  end if;

  if new.status = 'under-review' then
    update public.vehicles
    set status = 'needs-attention'
    where id = new.vehicle_id
      and status not in ('blocked', 'in-repair');

    return new;
  end if;

  if new.status = 'in-repair' then
    update public.vehicles
    set status = 'in-repair'
    where id = new.vehicle_id;

    return new;
  end if;

  if new.status in ('fixed', 'rejected') then
    select count(*)
    into unresolved_count
    from public.issues
    where vehicle_id = new.vehicle_id
      and id <> new.id
      and status in ('under-review', 'in-repair');

    if unresolved_count = 0 then
      update public.vehicles
      set status = 'active'
      where id = new.vehicle_id
        and status in ('needs-attention', 'blocked', 'in-repair');
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists issues_sync_vehicle_status on public.issues;

create trigger issues_sync_vehicle_status
after insert or update of status, vehicle_id
on public.issues
for each row
execute function public.sync_vehicle_status_from_issue();

update public.vehicles as vehicle
set status = 'needs-attention'
where status not in ('blocked', 'in-repair')
  and exists (
    select 1
    from public.issues as issue
    where issue.vehicle_id = vehicle.id
      and issue.status = 'under-review'
  );

update public.vehicles as vehicle
set status = 'in-repair'
where exists (
  select 1
  from public.issues as issue
  where issue.vehicle_id = vehicle.id
    and issue.status = 'in-repair'
);
