-- AviaInventory: Aviation Market Intelligence (Platinum).
--
-- 1. get_market_intelligence(p_days) builds the workspace from AviaInventory's own activity:
--    RFQ demand (part numbers, categories, countries, MRO), quoted price ranges, the
--    supplier's own performance against the market, and open RFQs worth quoting on.
--    Figures are aggregates only. Anything that could point to one buyer or one supplier
--    (prices, countries, buyer counts) is shown only when at least 3 companies are behind it.
-- 2. market_intelligence_reports: reports (PDF) the platform team uploads from the
--    console. Platinum users read and download them; files sit in a private bucket and are
--    served through short-lived signed links.

-- ---------------------------------------------------------------------------
-- Internal fact views (not exposed through the API).
-- ---------------------------------------------------------------------------

create or replace view public.market_rfq_facts
with (security_invoker = false) as
select r.id,
       r.buyer_id,
       r.supplier_id as target_supplier_id,
       r.rfq_type,
       r.status,
       r.created_at,
       r.required_date,
       r.quantity,
       f.part_number,
       upper(regexp_replace(coalesce(f.part_number, ''), '[^A-Za-z0-9]', '', 'g')) as part_key,
       f.category,
       -- "Engine" and "Engines" count as one category.
       regexp_replace(lower(coalesce(f.category, '')), 's$', '') as category_key,
       nullif(btrim(pr.country), '') as country,
       (select min(q.created_at) from public.quotes q where q.rfq_id = r.id) as first_quote_at
from public.rfqs r
left join public.parts p on p.id = r.part_id
left join public.profiles pr on pr.id = r.buyer_id
cross join lateral (
  select nullif(nullif(btrim(coalesce(p.part_number, (regexp_match(r.message, '^Part Number:[ \t]*([^\n]*)', 'n'))[1])), '-'), '') as part_number,
         nullif(nullif(btrim(coalesce(p.category, (regexp_match(r.message, '^Category:[ \t]*([^\n]*)', 'n'))[1])), '-'), '') as category
) f
where r.status <> 'Cancelled';

create or replace view public.market_quote_facts
with (security_invoker = false) as
select q.id,
       q.rfq_id,
       q.supplier_id,
       q.unit_price,
       upper(coalesce(nullif(btrim(q.currency), ''), 'USD')) as currency,
       q.status,
       q.created_at,
       f.part_number,
       f.part_key,
       f.category,
       f.rfq_type,
       greatest(extract(epoch from (q.created_at - f.created_at)) / 3600.0, 0) as response_hours
from public.quotes q
join public.market_rfq_facts f on f.id = q.rfq_id;

revoke all on public.market_rfq_facts from public, anon, authenticated;
revoke all on public.market_quote_facts from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- The workspace data.
-- ---------------------------------------------------------------------------

create or replace function public.get_market_intelligence(p_days integer default 90)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_uid uuid := auth.uid();
  v_days integer := least(greatest(coalesce(p_days, 90), 7), 365);
  v_from timestamptz := now() - make_interval(days => least(greatest(coalesce(p_days, 90), 7), 365));
  v_prev timestamptz := now() - make_interval(days => 2 * least(greatest(coalesce(p_days, 90), 7), 365));
  v_min constant integer := 3; -- companies needed before a figure is shown
  v_mro boolean;
  v_categories text[];
  v_summary jsonb;
  v_parts jsonb;
  v_categories_json jsonb;
  v_countries jsonb;
  v_prices jsonb;
  v_mro_demand jsonb;
  v_me jsonb;
  v_opportunities jsonb;
begin
  if v_uid is null then
    raise exception 'Sign in to view market intelligence' using errcode = '42501';
  end if;
  if not public.has_subscription_entitlement(v_uid, 'aviation_intelligence') then
    raise exception 'Aviation Market Intelligence is part of the Platinum plan' using errcode = '42501';
  end if;
  select s.mro_capable, coalesce(s.supplier_categories, array[]::text[]) into v_mro, v_categories
  from public.suppliers s where s.id = v_uid;
  if not found then
    raise exception 'Only supplier accounts can view market intelligence' using errcode = '42501';
  end if;

  -- Headline figures for the period, with the previous period for comparison.
  select jsonb_build_object(
           'rfqs', count(*) filter (where f.created_at >= v_from),
           'rfqs_previous', count(*) filter (where f.created_at < v_from),
           'parts_rfqs', count(*) filter (where f.created_at >= v_from and f.rfq_type <> 'mro'),
           'mro_rfqs', count(*) filter (where f.created_at >= v_from and f.rfq_type = 'mro'),
           'buyers', case when count(distinct f.buyer_id) filter (where f.created_at >= v_from) >= v_min
                          then count(distinct f.buyer_id) filter (where f.created_at >= v_from) end,
           'median_first_quote_hours', round((percentile_cont(0.5) within group (order by extract(epoch from (f.first_quote_at - f.created_at)) / 3600.0)
                                              filter (where f.created_at >= v_from and f.first_quote_at is not null))::numeric, 1)
         )
    into v_summary
  from public.market_rfq_facts f
  where f.created_at >= v_prev;

  select v_summary || jsonb_build_object(
           'quotes', count(*),
           'quotes_per_rfq', case when (v_summary->>'rfqs')::int > 0 then round(count(*)::numeric / (v_summary->>'rfqs')::int, 1) end
         )
    into v_summary
  from public.market_quote_facts q
  where q.created_at >= v_from;

  -- Most requested part numbers.
  select coalesce(jsonb_agg(row_to_json(t) order by t.rfqs desc, t.quantity desc nulls last), '[]'::jsonb)
    into v_parts
  from (
    select mode() within group (order by upper(f.part_number)) as part_number,
           mode() within group (order by f.category) as category,
           count(*) as rfqs,
           sum(f.quantity) as quantity,
           case when count(distinct f.buyer_id) >= v_min then count(distinct f.buyer_id) end as buyers,
           bool_or(f.rfq_type = 'mro') as includes_mro
    from public.market_rfq_facts f
    where f.created_at >= v_from and f.part_key <> ''
    group by f.part_key
    order by count(*) desc, sum(f.quantity) desc nulls last
    limit 10
  ) t;

  -- Demand by category, this period against the previous one.
  select coalesce(jsonb_agg(row_to_json(t) order by t.rfqs desc), '[]'::jsonb)
    into v_categories_json
  from (
    select mode() within group (order by initcap(f.category)) as category,
           count(*) filter (where f.created_at >= v_from) as rfqs,
           count(*) filter (where f.created_at < v_from) as rfqs_previous
    from public.market_rfq_facts f
    where f.created_at >= v_prev and f.category_key <> ''
    group by f.category_key
    having count(*) filter (where f.created_at >= v_from) > 0
    order by 2 desc
    limit 12
  ) t;

  -- Where demand comes from. Countries with fewer than 3 buyers are grouped as "Other".
  select coalesce(jsonb_agg(row_to_json(t) order by t.other, t.rfqs desc), '[]'::jsonb)
    into v_countries
  from (
    select case when c.buyers >= v_min then c.country else 'Other countries' end as country,
           sum(c.rfqs) as rfqs,
           c.buyers < v_min as other
    from (
      select coalesce(f.country, 'Not stated') as country, count(*) as rfqs, count(distinct f.buyer_id) as buyers
      from public.market_rfq_facts f
      where f.created_at >= v_from
      group by coalesce(f.country, 'Not stated')
    ) c
    group by 1, 3
  ) t;

  -- Quoted price ranges, only where at least 3 suppliers quoted the same part and currency.
  select coalesce(jsonb_agg(row_to_json(t) order by t.quotes desc), '[]'::jsonb)
    into v_prices
  from (
    select mode() within group (order by upper(q.part_number)) as part_number,
           q.currency,
           count(distinct q.supplier_id) as suppliers,
           count(*) as quotes,
           round(min(q.unit_price), 2) as low,
           round((percentile_cont(0.5) within group (order by q.unit_price))::numeric, 2) as median,
           round(max(q.unit_price), 2) as high
    from public.market_quote_facts q
    where q.created_at >= v_from and q.part_key <> '' and q.unit_price > 0
    group by q.part_key, q.currency
    having count(distinct q.supplier_id) >= v_min
    order by count(*) desc
    limit 10
  ) t;

  -- Repair / overhaul demand.
  select coalesce(jsonb_agg(row_to_json(t) order by t.rfqs desc), '[]'::jsonb)
    into v_mro_demand
  from (
    select coalesce(mode() within group (order by initcap(f.category)), 'Not stated') as category, count(*) as rfqs
    from public.market_rfq_facts f
    where f.created_at >= v_from and f.rfq_type = 'mro'
    group by f.category_key
    order by 2 desc
    limit 10
  ) t;

  -- The supplier's own results against the market.
  with visible as (
    select f.id from public.market_rfq_facts f
    where f.created_at >= v_from
      and f.buyer_id <> v_uid
      and (f.target_supplier_id is null or f.target_supplier_id = v_uid)
      and (f.rfq_type <> 'mro' or v_mro)
  ), mine as (
    select q.* from public.market_quote_facts q where q.supplier_id = v_uid and q.created_at >= v_from
  ), bands as (
    select q.part_key, q.currency, percentile_cont(0.5) within group (order by q.unit_price) as median
    from public.market_quote_facts q
    where q.created_at >= v_from and q.part_key <> '' and q.unit_price > 0
    group by q.part_key, q.currency
    having count(distinct q.supplier_id) >= v_min
  )
  select jsonb_build_object(
           'rfqs_available', (select count(*) from visible),
           'rfqs_quoted', (select count(distinct m.rfq_id) from mine m where m.rfq_id in (select id from visible)),
           'quotes', (select count(*) from mine),
           'quotes_won', (select count(*) from mine where status = 'Accepted'),
           'median_response_hours', (select round((percentile_cont(0.5) within group (order by response_hours))::numeric, 1) from mine),
           'market_median_response_hours', (select round((percentile_cont(0.5) within group (order by response_hours))::numeric, 1)
                                             from public.market_quote_facts where created_at >= v_from),
           'price_vs_median_pct', (select round((avg((m.unit_price / nullif(b.median, 0) - 1) * 100))::numeric, 1)
                                   from mine m join bands b on b.part_key = m.part_key and b.currency = m.currency
                                   where m.unit_price > 0),
           'price_compared_quotes', (select count(*) from mine m join bands b on b.part_key = m.part_key and b.currency = m.currency
                                     where m.unit_price > 0)
         )
    into v_me;

  -- Open RFQs this supplier can still quote on, its own categories first.
  select coalesce(jsonb_agg(row_to_json(t) order by t.matches_category desc, t.required_date nulls last, t.created_at desc), '[]'::jsonb)
    into v_opportunities
  from (
    select f.id, f.part_number, initcap(f.category) as category, f.quantity, f.required_date, f.rfq_type, f.created_at,
           exists (select 1 from unnest(v_categories) c where regexp_replace(lower(btrim(c)), 's$', '') = f.category_key) as matches_category,
           (select count(*) from public.quotes q where q.rfq_id = f.id) as quotes
    from public.market_rfq_facts f
    where f.status in ('Pending', 'Quoted')
      and (f.required_date is null or f.required_date > current_date)
      and f.buyer_id <> v_uid
      and (f.target_supplier_id is null or f.target_supplier_id = v_uid)
      and (f.rfq_type <> 'mro' or v_mro)
      and not exists (select 1 from public.quotes q where q.rfq_id = f.id and q.supplier_id = v_uid)
    order by 8 desc, f.required_date nulls last, f.created_at desc
    limit 10
  ) t;

  return jsonb_build_object(
    'period_days', v_days,
    'generated_at', now(),
    'min_companies', v_min,
    'summary', v_summary,
    'top_parts', v_parts,
    'categories', v_categories_json,
    'countries', v_countries,
    'price_ranges', v_prices,
    'mro_demand', v_mro_demand,
    'my_performance', v_me,
    'opportunities', v_opportunities
  );
end;
$$;

revoke execute on function public.get_market_intelligence(integer) from public, anon;
grant execute on function public.get_market_intelligence(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Reports uploaded by the platform team.
-- ---------------------------------------------------------------------------

create table if not exists public.market_intelligence_reports (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 3 and 200),
  summary text check (summary is null or length(summary) <= 2000),
  category text check (category is null or length(category) <= 80),
  file_path text not null,
  file_name text not null,
  file_size bigint,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists market_intelligence_reports_published_idx
  on public.market_intelligence_reports (published_at desc) where published;

alter table public.market_intelligence_reports enable row level security;

-- Readers: Platinum users. Writes go through the platform console (service role).
drop policy if exists "Platinum users can read published reports" on public.market_intelligence_reports;
create policy "Platinum users can read published reports"
  on public.market_intelligence_reports for select to authenticated
  using (published and public.has_subscription_entitlement(auth.uid(), 'aviation_intelligence'));

revoke all on public.market_intelligence_reports from anon;
grant select on public.market_intelligence_reports to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('market-intelligence-reports', 'market-intelligence-reports', false, 52428800, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

notify pgrst, 'reload schema';
