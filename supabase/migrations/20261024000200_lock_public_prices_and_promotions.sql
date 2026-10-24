-- AviaInventory: client feedback (Oct 2026), part 2.
--
-- 1. Logged-out visitors must not see supplier names or part prices. Hiding them on
--    screen was not enough: the anon key could still read them through the API.
--    anon loses SELECT on parts.unit_price and on suppliers.company_name / website;
--    signed-in users (authenticated) keep full access. The public supplier RPCs return
--    a neutral name when there is no signed-in user.
-- 2. Platform admins can feature a supplier / MRO on the homepage (suppliers.featured),
--    alongside suppliers whose plan includes featured listings. Suppliers cannot set the
--    flag on themselves. Listing promotions keep using featured_listings, which admins
--    approve from the admin dashboard.

-- ---------------------------------------------------------------------------
-- 1. Column privileges for anon
-- ---------------------------------------------------------------------------

-- parts: everything a visitor needs except the price.
revoke select on public.parts from anon;
do $$
declare
  v_columns text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into v_columns
  from information_schema.columns
  where table_schema = 'public' and table_name = 'parts' and column_name <> 'unit_price';
  execute format('grant select (%s) on public.parts to anon', v_columns);
end;
$$;

-- suppliers: no name, website or registration details for visitors.
alter table public.suppliers add column if not exists featured boolean not null default false;

revoke select on public.suppliers from anon;
grant select (id, business_type, city, supplier_categories, created_at, verification_status,
              verification_completion, mro_capable, featured)
  on public.suppliers to anon;
-- suppliers uses column-level grants, so new columns must be granted explicitly.
grant select (featured) on public.suppliers to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Admin-only featured flag
-- ---------------------------------------------------------------------------

create or replace function public.guard_supplier_featured()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_direct_client_write() and new.featured is distinct from old.featured then
    raise exception 'Only AviaInventory can feature a supplier.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_supplier_featured() from public, anon, authenticated;

drop trigger if exists guard_supplier_featured on public.suppliers;
create trigger guard_supplier_featured
before update on public.suppliers
for each row execute function public.guard_supplier_featured();

-- ---------------------------------------------------------------------------
-- Public supplier RPCs: neutral names for visitors, admin-featured counts as promoted
-- ---------------------------------------------------------------------------

create or replace function public.get_public_supplier_summaries(result_limit integer default 3)
returns table(
  id uuid,
  company_name text,
  country text,
  city text,
  listing_count bigint,
  average_rating numeric,
  review_count bigint,
  logo_url text,
  verification_status text
)
language sql
security definer
set search_path = public
stable
as $$
  with active_listings as (
    select p.supplier_id, count(*)::bigint as listing_count
    from public.parts p where p.status = 'Published' group by p.supplier_id
  ), review_summary as (
    select sr.supplier_id, round(avg(sr.rating)::numeric, 1) as average_rating, count(*)::bigint as review_count
    from public.supplier_reviews sr where sr.is_published = true group by sr.supplier_id
  )
  select s.id,
         case when auth.uid() is null then 'Verified Supplier' else coalesce(s.company_name, 'Supplier') end,
         pr.country, s.city,
         al.listing_count, rs.average_rating, coalesce(rs.review_count, 0)::bigint, null::text,
         coalesce(s.verification_status, 'Draft')
  from public.suppliers s
  join active_listings al on al.supplier_id = s.id
  left join public.profiles pr on pr.id = s.id
  left join review_summary rs on rs.supplier_id = s.id
  order by al.listing_count desc, s.company_name asc
  limit greatest(coalesce(result_limit, 3), 0);
$$;

grant execute on function public.get_public_supplier_summaries(integer) to anon, authenticated;

create or replace function public.get_public_supplier_directory(result_limit integer default 24, mro_only boolean default false)
returns table(
  id uuid,
  company_name text,
  country text,
  city text,
  listing_count bigint,
  average_rating numeric,
  review_count bigint,
  logo_url text,
  verification_status text,
  business_type text,
  mro_capable boolean,
  promoted boolean
)
language sql
security definer
set search_path = public
stable
as $$
  with active_listings as (
    select p.supplier_id, count(*)::bigint as listing_count
    from public.parts p where p.status = 'Published' group by p.supplier_id
  ), review_summary as (
    select sr.supplier_id, round(avg(sr.rating)::numeric, 1) as average_rating, count(*)::bigint as review_count
    from public.supplier_reviews sr where sr.is_published = true group by sr.supplier_id
  ), directory as (
    select s.id,
           case when auth.uid() is null
             then case when s.mro_capable then 'Verified MRO' else 'Verified Supplier' end
             else coalesce(s.company_name, 'Supplier') end as company_name,
           pr.country, s.city,
           coalesce(al.listing_count, 0)::bigint as listing_count, rs.average_rating,
           coalesce(rs.review_count, 0)::bigint as review_count, null::text as logo_url,
           coalesce(s.verification_status, 'Draft') as verification_status, s.business_type,
           s.mro_capable,
           (s.featured or public.has_subscription_entitlement(s.id, 'featured_listings')) as promoted,
           s.company_name as sort_name
    from public.suppliers s
    left join active_listings al on al.supplier_id = s.id
    left join public.profiles pr on pr.id = s.id
    left join review_summary rs on rs.supplier_id = s.id
    where (mro_only and s.mro_capable) or (not mro_only and al.listing_count is not null)
  )
  select id, company_name, country, city, listing_count, average_rating, review_count, logo_url,
         verification_status, business_type, mro_capable, promoted
  from directory
  order by promoted desc, (verification_status = 'Verified') desc, listing_count desc, sort_name asc
  limit greatest(least(coalesce(result_limit, 24), 100), 0);
$$;

grant execute on function public.get_public_supplier_directory(integer, boolean) to anon, authenticated;

-- PostgREST caches privileges and function signatures.
notify pgrst, 'reload schema';
