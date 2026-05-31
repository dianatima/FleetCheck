-- Run in Supabase SQL Editor after reproducing a new pre-trip/post-trip submit.
-- Replace :inspection_id with a real UUID from reports if needed.

-- 1) Verify required tables/columns exist.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'inspections',
    'inspection_results',
    'inspection_signature_fallbacks',
    'inspection_photo_verifications',
    'company_owners'
  )
order by table_name;

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'inspections'
  and column_name in ('signature_data_url', 'signed_at', 'signed_by_driver_id')
order by column_name;

-- 2) Latest inspections with signature signals.
select
  i.id,
  i.company_id,
  i.driver_id,
  i.type,
  i.status,
  i.created_at,
  i.submitted_at,
  ((to_jsonb(i) ->> 'signature_data_url') is not null) as has_signature_on_inspection,
  sf.id as signature_fallback_id,
  (sf.signature_data_url is not null) as has_signature_fallback,
  sf.signed_at as fallback_signed_at
from public.inspections i
left join lateral (
  select s.id, s.signature_data_url, s.signed_at
  from public.inspection_signature_fallbacks s
  where s.inspection_id = i.id
  order by s.signed_at desc nulls last
  limit 1
) sf on true
order by i.created_at desc
limit 30;

-- 3) Anti-fraud presence by inspection.
select
  i.id as inspection_id,
  i.type,
  i.status,
  count(pv.id) as fraud_rows,
  coalesce(max(pv.risk_score), 0) as max_risk
from public.inspections i
left join public.inspection_photo_verifications pv
  on pv.inspection_id = i.id
group by i.id, i.type, i.status, i.created_at
order by i.created_at desc
limit 30;

-- 4) Compare inspection photos count vs anti-fraud rows for latest inspections.
with latest as (
  select id, created_at
  from public.inspections
  order by created_at desc
  limit 30
),
result_photos as (
  select
    r.inspection_id,
    sum(coalesce(array_length(r.photo_urls, 1), 0)) as photos_count
  from public.inspection_results r
  join latest l on l.id = r.inspection_id
  group by r.inspection_id
),
fraud_rows as (
  select
    pv.inspection_id,
    count(*) as fraud_count
  from public.inspection_photo_verifications pv
  join latest l on l.id = pv.inspection_id
  group by pv.inspection_id
)
select
  l.id as inspection_id,
  coalesce(rp.photos_count, 0) as photos_count,
  coalesce(fr.fraud_count, 0) as fraud_count
from latest l
left join result_photos rp on rp.inspection_id = l.id
left join fraud_rows fr on fr.inspection_id = l.id
order by l.created_at desc;

-- 5) If fraud_count is 0 while photos_count > 0, inspect RLS policies currently installed.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('inspection_photo_verifications', 'inspection_signature_fallbacks')
order by tablename, policyname;

-- 6) Compact policy health check (PASS/FAIL for admin + company_owners support).
with p as (
  select
    tablename,
    policyname,
    coalesce(qual, '') as qual,
    coalesce(with_check, '') as with_check
  from pg_policies
  where schemaname = 'public'
    and tablename in ('inspection_photo_verifications', 'inspection_signature_fallbacks')
),
checks as (
  select
    tablename,
    policyname,
    (
      lower(qual || ' ' || with_check) like '%admin%'
    ) as has_admin_role_check,
    (
      lower(qual || ' ' || with_check) like '%company_owners%'
      or lower(qual || ' ' || with_check) like '%owner.profile_id%'
    ) as has_company_owners_check
  from p
)
select
  tablename,
  policyname,
  case when has_admin_role_check then 'PASS' else 'FAIL' end as admin_role_support,
  case when has_company_owners_check then 'PASS' else 'FAIL' end as company_owners_support
from checks
order by tablename, policyname;
