-- AviaInventory security audit (read-only). Run in the Supabase SQL editor.
-- The repo does not contain the original table definitions or the RLS policies for
-- profiles and buyers, so these must be checked against the live database.

-- 1. RLS enabled on the core tables? Every row should show rls_enabled = true.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('profiles', 'buyers', 'suppliers', 'parts', 'subscriptions', 'supplier_reviews')
order by 1;

-- 2. Every policy on the core tables. Look for:
--    - "using (true)" / "with check (true)" on insert/update/delete
--    - policies granted to anon on anything other than select
--    - select policies on profiles that expose email/phone to everyone
select tablename, policyname, cmd, roles, permissive, qual as using_expr, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'buyers', 'suppliers', 'parts', 'subscriptions', 'supplier_reviews')
order by tablename, cmd, policyname;

-- 3. Triggers on auth.users. After the 20261013 migration there should be exactly one
--    profile-creation trigger: handle_new_auth_user.
select tgname, pg_get_triggerdef(t.oid)
from pg_trigger t
where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal;

-- 4. Suppliers marked Verified without an admin review timestamp (possible self-verification).
select id, company_name, verification_status, verification_submitted_at, verification_reviewed_at
from public.suppliers
where verification_status = 'Verified'
  and verification_reviewed_at is null;

-- 5. Accounts holding the admin role. Confirm every one of these is a real administrator.
select p.id, p.email, p.account_type, p.account_roles
from public.profiles p
where p.account_type = 'admin' or 'admin' = any(p.account_roles);

-- 6. Auth users with no profile / buyer row (half-created accounts from the old signup flow).
select u.id, u.email, u.created_at, u.email_confirmed_at,
       (select count(*) from public.profiles p where p.id = u.id) as has_profile,
       (select count(*) from public.buyers b where b.id = u.id) as has_buyer
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
   or not exists (select 1 from public.buyers b where b.id = u.id)
order by u.created_at desc;
