-- AviaInventory: keep signup details out of the auth record (data minimisation).
--
-- Registration sends the whole signup form (phone, address, onboarding answers) as auth
-- user metadata, and /auth/v1/user returns that metadata on every session check.
-- handle_new_auth_user() already copies it into profiles/buyers/suppliers, so afterwards
-- the auth record keeps only what the auth emails and the UI need: name, company, roles.
-- Accounts created before this change are trimmed the same way.

create or replace function public.lean_auth_metadata(p_meta jsonb)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'full_name', nullif(p_meta->>'full_name', ''),
    'company_name', nullif(p_meta->>'company_name', ''),
    'account_roles', case when jsonb_typeof(p_meta->'account_roles') = 'array' then p_meta->'account_roles' end
  ));
$$;

revoke execute on function public.lean_auth_metadata(jsonb) from public, anon, authenticated;

-- Runs after handle_new_auth_user (trigger names fire alphabetically), once the profile exists.
create or replace function public.trim_new_auth_user_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set raw_user_meta_data = public.lean_auth_metadata(coalesce(new.raw_user_meta_data, '{}'::jsonb))
  where id = new.id;
  return new;
end;
$$;

revoke execute on function public.trim_new_auth_user_metadata() from public, anon, authenticated;

drop trigger if exists zz_trim_new_auth_user_metadata on auth.users;
create trigger zz_trim_new_auth_user_metadata
after insert on auth.users
for each row execute function public.trim_new_auth_user_metadata();

-- Existing accounts: first copy anything the profile is missing (some older accounts were
-- backfilled with only name/company), so trimming the auth record loses nothing.
update public.profiles p
set phone = coalesce(p.phone, nullif(u.raw_user_meta_data->>'phone', '')),
    country = coalesce(p.country, nullif(u.raw_user_meta_data->>'country', '')),
    job_title = coalesce(p.job_title, nullif(u.raw_user_meta_data->>'job_title', '')),
    business_type = coalesce(p.business_type, nullif(u.raw_user_meta_data->>'business_type', '')),
    website = coalesce(p.website, nullif(u.raw_user_meta_data->>'website', '')),
    registration_number = coalesce(p.registration_number, nullif(u.raw_user_meta_data->>'registration_number', '')),
    address = coalesce(p.address, nullif(u.raw_user_meta_data->>'address', '')),
    city = coalesce(p.city, nullif(u.raw_user_meta_data->>'city', ''))
from auth.users u
where u.id = p.id;

update public.buyers b
set address = coalesce(b.address, p.address),
    city = coalesce(b.city, p.city),
    registration_number = coalesce(b.registration_number, p.registration_number)
from public.profiles p
where p.id = b.id;

update public.suppliers s
set address = coalesce(s.address, p.address),
    city = coalesce(s.city, p.city),
    registration_number = coalesce(s.registration_number, p.registration_number)
from public.profiles p
where p.id = s.id;

update auth.users
set raw_user_meta_data = public.lean_auth_metadata(coalesce(raw_user_meta_data, '{}'::jsonb))
where raw_user_meta_data is distinct from public.lean_auth_metadata(coalesce(raw_user_meta_data, '{}'::jsonb));
