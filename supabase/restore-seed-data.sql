-- Restores reference data wiped by truncating every public table.
-- Run in the Supabase SQL Editor. Safe to run more than once.

begin;

-- 1. Subscription plans (from 20260923000200 + 20261106000100). Sign-up fails without these:
--    the ensure_trial_subscription trigger inserts a 'buyer_trial' / 'hybrid_trial' subscription.
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

-- 90-day Platinum trial (20261106000100).
update public.subscription_plans
set name = 'Platinum Trial',
    entitlements = (select entitlements from public.subscription_plans where code = 'hybrid_platinum'),
    updated_at = now()
where code in ('buyer_trial', 'hybrid_trial');

commit;

-- 2. Notification dispatcher settings (WhatsApp + email). Fill in your real values, then run:
-- insert into public.private_app_settings (key, value) values
--   ('whatsapp_dispatch_url',    'https://<your-domain>/api/notifications/dispatch'),
--   ('whatsapp_dispatch_secret', '<same value as the dispatch secret env var>')
-- on conflict (key) do update set value = excluded.value;

-- 3. Auth users are NOT removed by truncating public tables. Old test logins still exist in
--    auth.users with no profile, and their emails will say "already exists". Remove them in
--    Dashboard → Authentication → Users, or:
-- delete from auth.users;   -- removes ALL logins, including yours
