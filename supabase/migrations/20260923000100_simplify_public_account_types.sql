-- AviaInventory: simplify public account choices to Buyer and Buyer & Supplier.
-- Supplier remains an internal capability for Hybrid accounts.
-- This migration is non-destructive and safe to re-run.

-- Ensure the hybrid role column exists for deployments that have not applied the
-- original hybrid-account migration yet.
alter table public.profiles
  add column if not exists account_roles text[] not null default array[]::text[];

-- Normalize legacy profiles:
--   buyer-only     -> buyer
--   supplier-only  -> buyer + supplier
--   existing hybrid -> buyer + supplier
--   admin          -> admin
update public.profiles
set account_roles = case
  when account_type = 'admin' then array['admin']::text[]
  when account_type = 'supplier' then array['buyer','supplier']::text[]
  when account_roles @> array['supplier']::text[] then array['buyer','supplier']::text[]
  else array['buyer']::text[]
end,
account_type = case
  when account_type = 'admin' then 'admin'
  else 'buyer'
end
where account_roles = array[]::text[]
   or account_type = 'supplier'
   or account_roles @> array['supplier']::text[];

-- Also normalize any existing buyer profiles that have no roles.
update public.profiles
set account_roles = array['buyer']::text[]
where account_type = 'buyer'
  and (account_roles is null or cardinality(account_roles) = 0);

-- Preserve the existing role set while explicitly allowing only known roles.
alter table public.profiles
drop constraint if exists profiles_account_roles_check;

alter table public.profiles
add constraint profiles_account_roles_check
check (
  account_roles <@ array['buyer','supplier','admin']::text[]
  and cardinality(account_roles) > 0
);

-- Canonical hybrid upgrade: Buyer -> Buyer + Supplier.
create or replace function public.upgrade_to_hybrid_account()
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_roles text[];
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'Account profile not found';
  end if;

  if v_profile.account_type = 'admin'
     or coalesce('admin' = any(v_profile.account_roles), false) then
    raise exception 'Admin accounts cannot be converted';
  end if;

  insert into public.buyers (
    id, company_name, business_type, website, registration_number,
    job_title, address, city
  ) values (
    v_user_id, v_profile.company_name, v_profile.business_type,
    v_profile.website, v_profile.registration_number, v_profile.job_title,
    v_profile.address, v_profile.city
  )
  on conflict (id) do update set
    company_name = coalesce(public.buyers.company_name, excluded.company_name),
    business_type = coalesce(public.buyers.business_type, excluded.business_type),
    website = coalesce(public.buyers.website, excluded.website),
    registration_number = coalesce(public.buyers.registration_number, excluded.registration_number),
    job_title = coalesce(public.buyers.job_title, excluded.job_title),
    address = coalesce(public.buyers.address, excluded.address),
    city = coalesce(public.buyers.city, excluded.city);

  insert into public.suppliers (
    id, company_name, business_type, website, registration_number,
    address, city, supplier_categories
  ) values (
    v_user_id, v_profile.company_name, v_profile.business_type,
    v_profile.website, v_profile.registration_number, v_profile.address,
    v_profile.city, coalesce(v_profile.supplier_categories, array[]::text[])
  )
  on conflict (id) do update set
    company_name = coalesce(public.suppliers.company_name, excluded.company_name),
    business_type = coalesce(public.suppliers.business_type, excluded.business_type),
    website = coalesce(public.suppliers.website, excluded.website),
    registration_number = coalesce(public.suppliers.registration_number, excluded.registration_number),
    address = coalesce(public.suppliers.address, excluded.address),
    city = coalesce(public.suppliers.city, excluded.city),
    supplier_categories = case
      when coalesce(cardinality(public.suppliers.supplier_categories), 0) = 0
        then excluded.supplier_categories
      else public.suppliers.supplier_categories
    end;

  v_roles := array['buyer','supplier']::text[];

  update public.profiles
  set account_roles = v_roles,
      account_type = 'buyer'
  where id = v_user_id;

  return v_roles;
end;
$$;

grant execute on function public.upgrade_to_hybrid_account() to authenticated;
