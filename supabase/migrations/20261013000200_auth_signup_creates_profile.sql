-- AviaInventory: create the account profile server-side when an auth user is created.
--
-- Previously the browser upserted profiles/buyers/suppliers straight after signUp().
-- With email confirmation enabled there is no session at that point, so the writes ran
-- as `anon` and were rejected by RLS, leaving half-created accounts with no trial.
--
-- This trigger runs inside the auth.users insert, so the profile (and, through
-- profiles_create_trial_subscription, the trial subscription) always exists.
-- Signup metadata is client-controlled: roles are whitelisted and account_type is fixed.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_is_hybrid boolean := coalesce(v_meta->'account_roles', '[]'::jsonb) ? 'supplier';
  v_roles text[] := case when v_is_hybrid then array['buyer','supplier'] else array['buyer'] end;
  v_supplier_categories text[] := coalesce(
    (select array_agg(value) from jsonb_array_elements_text(
      case when jsonb_typeof(v_meta->'supplier_categories') = 'array'
        then v_meta->'supplier_categories' else '[]'::jsonb end
    )),
    array[]::text[]
  );
  v_completion integer := case
    when v_meta->>'onboarding_completion' ~ '^\d{1,3}$' then least(100, (v_meta->>'onboarding_completion')::integer)
    else 0
  end;
begin
  insert into public.profiles (
    id, account_type, account_roles, email, full_name, phone, country, job_title,
    company_name, business_type, website, registration_number, address, city,
    supplier_categories, onboarding_status, onboarding_completion, onboarding_data
  ) values (
    new.id, 'buyer', v_roles, new.email,
    nullif(v_meta->>'full_name', ''), nullif(v_meta->>'phone', ''), nullif(v_meta->>'country', ''),
    nullif(v_meta->>'job_title', ''), nullif(v_meta->>'company_name', ''), nullif(v_meta->>'business_type', ''),
    nullif(v_meta->>'website', ''), nullif(v_meta->>'registration_number', ''),
    nullif(v_meta->>'address', ''), nullif(v_meta->>'city', ''),
    v_supplier_categories, 'in_progress', v_completion,
    case when jsonb_typeof(v_meta->'onboarding_data') = 'object' then v_meta->'onboarding_data' else '{}'::jsonb end
  )
  on conflict (id) do nothing;

  insert into public.buyers (
    id, company_name, business_type, website, registration_number, job_title, address, city
  )
  select p.id, p.company_name, p.business_type, p.website, p.registration_number, p.job_title, p.address, p.city
  from public.profiles p where p.id = new.id
  on conflict (id) do nothing;

  if v_is_hybrid then
    insert into public.suppliers (
      id, company_name, business_type, website, registration_number, address, city, supplier_categories
    )
    select p.id, p.company_name, p.business_type, p.website, p.registration_number, p.address, p.city, p.supplier_categories
    from public.profiles p where p.id = new.id
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

-- Replace the dashboard-created trigger found in production (on_auth_user_created ->
-- handle_new_user). It copied account_type from client-supplied signup metadata, so
-- anyone could register with account_type = 'admin'. Only one trigger should create
-- profiles, and the old function must not stay callable via /rest/v1/rpc.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop trigger if exists handle_new_auth_user on auth.users;
create trigger handle_new_auth_user
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Trigger-only function: keep it off the public RPC API.
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

-- Backfill accounts that were left half-created by the old client-side flow.
insert into public.profiles (id, account_type, account_roles, email, full_name, company_name, onboarding_status, onboarding_completion, onboarding_data)
select u.id, 'buyer',
  case when coalesce(u.raw_user_meta_data->'account_roles', '[]'::jsonb) ? 'supplier'
    then array['buyer','supplier'] else array['buyer'] end,
  u.email,
  nullif(u.raw_user_meta_data->>'full_name', ''),
  nullif(u.raw_user_meta_data->>'company_name', ''),
  'in_progress', 0, '{}'::jsonb
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

insert into public.buyers (id, company_name, business_type, website, registration_number, job_title, address, city)
select p.id, p.company_name, p.business_type, p.website, p.registration_number, p.job_title, p.address, p.city
from public.profiles p
where 'buyer' = any(p.account_roles)
  and not exists (select 1 from public.buyers b where b.id = p.id);

insert into public.suppliers (id, company_name, business_type, website, registration_number, address, city, supplier_categories)
select p.id, p.company_name, p.business_type, p.website, p.registration_number, p.address, p.city, coalesce(p.supplier_categories, array[]::text[])
from public.profiles p
where 'supplier' = any(p.account_roles)
  and not exists (select 1 from public.suppliers s where s.id = p.id);
