-- Live homepage category counts and supplier review summaries.
-- Apply this migration before testing the homepage counts/reviews.

create table if not exists public.supplier_reviews (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text,
  comment text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists supplier_reviews_supplier_id_idx on public.supplier_reviews(supplier_id);
create index if not exists supplier_reviews_published_idx on public.supplier_reviews(supplier_id, is_published, created_at desc);

alter table public.supplier_reviews enable row level security;

drop policy if exists "Public can read published supplier reviews" on public.supplier_reviews;
create policy "Public can read published supplier reviews"
  on public.supplier_reviews for select
  using (is_published = true);

drop policy if exists "Authenticated users can submit supplier reviews" on public.supplier_reviews;
create policy "Authenticated users can submit supplier reviews"
  on public.supplier_reviews for insert
  to authenticated
  with check (reviewer_id = auth.uid());

create or replace function public.get_public_category_listing_counts()
returns table(category text, listing_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select p.category, count(*)::bigint
  from public.parts p
  where p.status = 'Published'
    and p.category is not null
    and btrim(p.category) <> ''
  group by p.category;
$$;

grant execute on function public.get_public_category_listing_counts() to anon, authenticated;

create or replace function public.get_public_supplier_summaries(result_limit integer default 3)
returns table(
  id uuid,
  company_name text,
  country text,
  city text,
  listing_count bigint,
  average_rating numeric,
  review_count bigint,
  logo_url text
)
language sql
security definer
set search_path = public
stable
as $$
  with active_listings as (
    select p.supplier_id, count(*)::bigint as listing_count
    from public.parts p
    where p.status = 'Published'
    group by p.supplier_id
  ),
  review_summary as (
    select sr.supplier_id,
           round(avg(sr.rating)::numeric, 1) as average_rating,
           count(*)::bigint as review_count
    from public.supplier_reviews sr
    where sr.is_published = true
    group by sr.supplier_id
  )
  select s.id,
         coalesce(s.company_name, 'Verified Supplier') as company_name,
         pr.country,
         s.city,
         al.listing_count,
         rs.average_rating,
         coalesce(rs.review_count, 0)::bigint as review_count,
         null::text as logo_url
  from public.suppliers s
  join active_listings al on al.supplier_id = s.id
  left join public.profiles pr on pr.id = s.id
  left join review_summary rs on rs.supplier_id = s.id
  order by al.listing_count desc, s.company_name asc
  limit greatest(coalesce(result_limit, 3), 0);
$$;

grant execute on function public.get_public_supplier_summaries(integer) to anon, authenticated;
