-- AviaInventory subscriptions, billing, premium marketplace services and marketing requests.
-- Non-destructive: business records are never deleted when subscription access changes.

create table if not exists public.subscription_plans (
  code text primary key,
  name text not null,
  account_type text not null check (account_type in ('buyer','hybrid')),
  monthly_price_cents integer not null default 0 check (monthly_price_cents >= 0),
  annual_price_cents integer not null default 0 check (annual_price_cents >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  trial_days integer not null default 0 check (trial_days >= 0),
  entitlements jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.subscription_plans(code,name,account_type,monthly_price_cents,annual_price_cents,trial_days,entitlements)
values
('buyer_trial','Free Trial','buyer',0,0,90,'["marketplace","buyer_features"]'),
('buyer_basic','Basic — Buyer','buyer',1200,10000,0,'["marketplace","buyer_features"]'),
('hybrid_trial','Free Trial','hybrid',0,0,90,'["marketplace","buyer_features","supplier_features"]'),
('hybrid_basic','Basic — Buyer & Supplier','hybrid',2500,20000,0,'["marketplace","buyer_features","supplier_features"]'),
('hybrid_bronze','Bronze — Buyer & Supplier','hybrid',4800,55000,0,'["marketplace","buyer_features","supplier_features","featured_listings","promotions","priority_search"]'),
('hybrid_platinum','Platinum — Buyer & Supplier','hybrid',9500,100000,0,'["marketplace","buyer_features","supplier_features","featured_listings","promotions","priority_search","aviation_intelligence","newsletter_promotion","whatsapp_promotion","external_advertising"]')
on conflict (code) do update set
 name=excluded.name, account_type=excluded.account_type, monthly_price_cents=excluded.monthly_price_cents,
 annual_price_cents=excluded.annual_price_cents, trial_days=excluded.trial_days, entitlements=excluded.entitlements,
 is_active=true, updated_at=now();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references auth.users(id) on delete cascade,
  account_type text not null check (account_type in ('buyer','hybrid')),
  plan_code text not null references public.subscription_plans(code),
  billing_interval text check (billing_interval in ('month','year')),
  status text not null check (status in ('trialing','active','past_due','cancelled','expired','incomplete','payment_failed')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_active_user_idx
  on public.subscriptions(user_id)
  where status in ('trialing','active','past_due','incomplete');
create unique index if not exists subscriptions_provider_subscription_idx
  on public.subscriptions(provider_subscription_id)
  where provider_subscription_id is not null;
create index if not exists subscriptions_company_idx on public.subscriptions(company_id);
create index if not exists subscriptions_plan_status_idx on public.subscriptions(plan_code,status);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  status text not null default 'received' check (status in ('received','processed','failed','ignored')),
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(provider,provider_event_id)
);

create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  provider text,
  provider_invoice_id text,
  currency text not null default 'USD',
  amount_due_cents integer not null default 0,
  amount_paid_cents integer not null default 0,
  status text not null default 'open',
  hosted_invoice_url text,
  invoice_pdf_url text,
  period_start timestamptz,
  period_end timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider,provider_invoice_id)
);

create table if not exists public.featured_listings (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.parts(id) on delete cascade,
  status text not null default 'Draft' check (status in ('Draft','Submitted','Approved','Active','Expired','Rejected')),
  starts_at timestamptz,
  ends_at timestamptz,
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(listing_id)
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  discount text,
  starts_at timestamptz,
  ends_at timestamptz,
  listing_ids uuid[] not null default array[]::uuid[],
  status text not null default 'Draft' check (status in ('Draft','Submitted','Approved','Active','Expired','Rejected')),
  approval_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_requests (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('newsletter','whatsapp','external_advertising')),
  status text not null default 'Draft' check (status in ('Draft','Submitted','Under Review','Approved','Scheduled','Active','Completed','Rejected')),
  campaign_objective text,
  target_audience text,
  promotional_content text,
  starts_at timestamptz,
  ends_at timestamptz,
  notes text,
  performance_data jsonb,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.aviation_intelligence_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  dataset_status text not null default 'setup_required',
  updated_at timestamptz not null default now()
);

alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_events enable row level security;
alter table public.billing_invoices enable row level security;
alter table public.featured_listings enable row level security;
alter table public.promotions enable row level security;
alter table public.marketing_requests enable row level security;
alter table public.aviation_intelligence_access enable row level security;

drop policy if exists "Anyone can view active subscription plans" on public.subscription_plans;
create policy "Anyone can view active subscription plans" on public.subscription_plans for select to anon,authenticated using (is_active = true);

drop policy if exists "Users view own subscription" on public.subscriptions;
create policy "Users view own subscription" on public.subscriptions for select to authenticated using (user_id = auth.uid() or company_id = auth.uid());

drop policy if exists "Users view own invoices" on public.billing_invoices;
create policy "Users view own invoices" on public.billing_invoices for select to authenticated using (user_id = auth.uid());

drop policy if exists "Suppliers view own featured listings" on public.featured_listings;
create policy "Suppliers view own featured listings" on public.featured_listings for select to authenticated using (supplier_id = auth.uid());
drop policy if exists "Suppliers create own featured listings" on public.featured_listings;
create policy "Suppliers create own featured listings" on public.featured_listings for insert to authenticated with check (supplier_id = auth.uid());
drop policy if exists "Suppliers update own featured listings" on public.featured_listings;
create policy "Suppliers update own featured listings" on public.featured_listings for update to authenticated using (supplier_id = auth.uid()) with check (supplier_id = auth.uid());

drop policy if exists "Suppliers manage own promotions" on public.promotions;
create policy "Suppliers manage own promotions" on public.promotions for all to authenticated using (supplier_id = auth.uid()) with check (supplier_id = auth.uid());

drop policy if exists "Suppliers manage own marketing requests" on public.marketing_requests;
create policy "Suppliers manage own marketing requests" on public.marketing_requests for all to authenticated using (supplier_id = auth.uid()) with check (supplier_id = auth.uid());

drop policy if exists "Users view own intelligence access" on public.aviation_intelligence_access;
create policy "Users view own intelligence access" on public.aviation_intelligence_access for select to authenticated using (user_id = auth.uid());

-- Server-side helper for entitlement checks. Client users can read their own subscription,
-- but cannot directly mutate plan, price, status or provider identifiers.
create or replace function public.current_subscription_for_user(p_user_id uuid default auth.uid())
returns public.subscriptions
language sql
security definer
set search_path = public
as $$
  select s.* from public.subscriptions s
  where s.user_id = p_user_id
  order by s.created_at desc
  limit 1;
$$;
grant execute on function public.current_subscription_for_user(uuid) to authenticated;

create or replace function public.ensure_trial_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_type text;
  v_plan_code text;
  v_start timestamptz := coalesce(new.created_at, now());
begin
  if new.account_type = 'admin' or coalesce('admin' = any(new.account_roles), false) then
    return new;
  end if;
  v_account_type := case when coalesce('supplier' = any(new.account_roles), false) then 'hybrid' else 'buyer' end;
  v_plan_code := case when v_account_type = 'hybrid' then 'hybrid_trial' else 'buyer_trial' end;
  insert into public.subscriptions(user_id,company_id,account_type,plan_code,status,trial_started_at,trial_ends_at)
  values(new.id,new.id,v_account_type,v_plan_code,'trialing',v_start,v_start + interval '90 days')
  on conflict (user_id) where status in ('trialing','active','past_due','incomplete') do nothing;
  return new;
end;
$$;

drop trigger if exists profiles_create_trial_subscription on public.profiles;
create trigger profiles_create_trial_subscription
after insert on public.profiles
for each row execute function public.ensure_trial_subscription();

-- Backfill existing non-admin accounts that do not yet have a subscription.
insert into public.subscriptions(user_id,company_id,account_type,plan_code,status,trial_started_at,trial_ends_at)
select p.id,p.id,
  case when coalesce('supplier' = any(p.account_roles), false) then 'hybrid' else 'buyer' end,
  case when coalesce('supplier' = any(p.account_roles), false) then 'hybrid_trial' else 'buyer_trial' end,
  'trialing',now(),now() + interval '90 days'
from public.profiles p
where p.account_type <> 'admin'
  and not exists (select 1 from public.subscriptions s where s.user_id = p.id);

-- Keep the subscription account type aligned when Buyer -> Hybrid account conversion occurs.
create or replace function public.sync_hybrid_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce('supplier' = any(new.account_roles), false) and not coalesce('supplier' = any(old.account_roles), false) then
    update public.subscriptions
    set account_type='hybrid',
        plan_code=case when plan_code='buyer_trial' then 'hybrid_trial' else plan_code end,
        updated_at=now()
    where user_id=new.id and status in ('trialing','active','past_due','incomplete');
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_sync_hybrid_subscription on public.profiles;
create trigger profiles_sync_hybrid_subscription
after update of account_roles on public.profiles
for each row execute function public.sync_hybrid_subscription();

-- Helpful public marketplace views can use only currently active promotional records.
create index if not exists featured_listings_active_idx on public.featured_listings(status,starts_at,ends_at);
create index if not exists promotions_active_idx on public.promotions(status,starts_at,ends_at);
create index if not exists marketing_requests_supplier_idx on public.marketing_requests(supplier_id,created_at desc);
create index if not exists billing_invoices_user_idx on public.billing_invoices(user_id,created_at desc);

-- Entitlement enforcement for premium supplier services at the database boundary.
create or replace function public.has_subscription_entitlement(p_user_id uuid, p_entitlement text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    join public.subscription_plans p on p.code = s.plan_code
    where s.user_id = p_user_id
      and s.status in ('trialing','active','past_due')
      and (
        (s.status = 'trialing' and s.trial_ends_at > now())
        or (s.status = 'active')
        or (s.status = 'past_due' and coalesce(s.current_period_end, now()) + make_interval(days => 7) > now())
      )
      and p.entitlements ? p_entitlement
  );
$$;
grant execute on function public.has_subscription_entitlement(uuid,text) to authenticated, anon;

drop policy if exists "Suppliers create own featured listings" on public.featured_listings;
create policy "Eligible suppliers create own featured listings" on public.featured_listings
for insert to authenticated
with check (supplier_id = auth.uid() and public.has_subscription_entitlement(auth.uid(),'featured_listings'));
drop policy if exists "Suppliers update own featured listings" on public.featured_listings;
create policy "Eligible suppliers update own featured listings" on public.featured_listings
for update to authenticated
using (supplier_id = auth.uid())
with check (supplier_id = auth.uid() and public.has_subscription_entitlement(auth.uid(),'featured_listings'));

drop policy if exists "Suppliers manage own promotions" on public.promotions;
create policy "Eligible suppliers manage own promotions" on public.promotions
for all to authenticated
using (supplier_id = auth.uid())
with check (supplier_id = auth.uid() and public.has_subscription_entitlement(auth.uid(),'promotions'));

drop policy if exists "Suppliers manage own marketing requests" on public.marketing_requests;
create policy "Eligible suppliers manage own marketing requests" on public.marketing_requests
for all to authenticated
using (supplier_id = auth.uid())
with check (supplier_id = auth.uid() and public.has_subscription_entitlement(auth.uid(),'newsletter_promotion'));

-- Marketplace ranking helper: premium visibility is a bounded boost, never a hard first-place rule.
create or replace function public.marketplace_supplier_search_boosts(p_supplier_ids uuid[])
returns table(supplier_id uuid, boost integer)
language sql
security definer
set search_path = public
as $$
  select s.user_id,
    case
      when s.plan_code = 'hybrid_platinum' then 25
      when s.plan_code = 'hybrid_bronze' then 15
      else 0
    end as boost
  from public.subscriptions s
  where s.user_id = any(p_supplier_ids)
    and s.status in ('trialing','active','past_due')
    and (s.status <> 'trialing' or s.trial_ends_at > now())
    and s.plan_code in ('hybrid_bronze','hybrid_platinum');
$$;
grant execute on function public.marketplace_supplier_search_boosts(uuid[]) to anon, authenticated;
