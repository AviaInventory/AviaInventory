-- AviaInventory: allow one company/user to operate as both buyer and supplier.
-- Backward compatible: account_type remains the primary/default role while
-- account_roles stores every enabled role.

alter table public.profiles
  add column if not exists account_roles text[] not null default array[]::text[];

update public.profiles
set account_roles = case
  when account_type = 'buyer' then array['buyer']::text[]
  when account_type = 'supplier' then array['supplier']::text[]
  when account_type = 'admin' then array['admin']::text[]
  else array[]::text[]
end
where account_roles = array[]::text[];

alter table public.profiles
drop constraint if exists profiles_account_roles_check;

alter table public.profiles
add constraint profiles_account_roles_check
check (
  account_roles <@ array['buyer','supplier','admin']::text[]
  and cardinality(account_roles) > 0
);

create index if not exists profiles_account_roles_gin_idx
  on public.profiles using gin (account_roles);

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
    company_name = excluded.company_name,
    business_type = excluded.business_type,
    website = excluded.website,
    registration_number = excluded.registration_number,
    job_title = excluded.job_title,
    address = excluded.address,
    city = excluded.city;

  insert into public.suppliers (
    id, company_name, business_type, website, registration_number,
    address, city, supplier_categories
  ) values (
    v_user_id, v_profile.company_name, v_profile.business_type,
    v_profile.website, v_profile.registration_number, v_profile.address,
    v_profile.city, coalesce(v_profile.supplier_categories, array[]::text[])
  )
  on conflict (id) do update set
    company_name = excluded.company_name,
    business_type = excluded.business_type,
    website = excluded.website,
    registration_number = excluded.registration_number,
    address = excluded.address,
    city = excluded.city,
    supplier_categories = excluded.supplier_categories;

  v_roles := array['buyer','supplier']::text[];

  update public.profiles
  set account_roles = v_roles,
      account_type = case when v_profile.account_type = 'supplier' then 'supplier' else 'buyer' end
  where id = v_user_id;

  return v_roles;
end;
$$;

grant execute on function public.upgrade_to_hybrid_account() to authenticated;
