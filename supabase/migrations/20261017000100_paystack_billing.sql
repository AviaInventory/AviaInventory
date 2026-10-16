-- AviaInventory: Paystack billing (cards and M-Pesa) replaces Stripe.
--
-- * Card payments use Paystack subscriptions (automatic renewal). Paystack plans have a
--   fixed amount and currency, so each plan/interval/amount gets its own Paystack plan,
--   created on first use and cached in paystack_plans.
-- * M-Pesa cannot renew automatically: each payment buys one billing period.
-- * The existing provider_* columns are reused (provider = 'paystack');
--   provider_customer_id = CUS_..., provider_subscription_id = SUB_... (cards only).

create table if not exists public.paystack_plans (
  id uuid primary key default gen_random_uuid(),
  plan_code text not null,
  billing_interval text not null check (billing_interval in ('month', 'year')),
  currency text not null,
  amount_minor integer not null check (amount_minor > 0),
  paystack_plan_code text not null unique,
  created_at timestamptz not null default now(),
  unique (plan_code, billing_interval, currency, amount_minor)
);

-- Server-only (service role); no client policies.
alter table public.paystack_plans enable row level security;
revoke all on table public.paystack_plans from anon, authenticated;

alter table public.subscriptions
  add column if not exists payment_method text check (payment_method in ('card', 'mpesa')),
  add column if not exists provider_plan_code text;

-- Paystack's email token lets the server cancel a card subscription. It is kept apart
-- from subscriptions (which users can read) so it never reaches a browser.
create table if not exists public.paystack_subscription_tokens (
  subscription_code text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  paystack_plan_code text,
  email_token text not null,
  created_at timestamptz not null default now()
);

alter table public.paystack_subscription_tokens enable row level security;
revoke all on table public.paystack_subscription_tokens from anon, authenticated;

alter table public.billing_invoices
  add column if not exists payment_channel text;
