alter table public.inspection_results
alter column result drop not null,
alter column result drop default;

alter table public.inspection_results
drop constraint if exists inspection_results_result_check;

alter table public.inspection_results
add constraint inspection_results_result_check
check (result is null or result in ('pass', 'fail', 'not_applicable'));
