-- AviaInventory: let the server check whether an email is registered before sending a
-- password reset link (product decision: tell the user when no account exists).
--
-- Only the service role may call this. Exposing it to anon/authenticated would let anyone
-- test which emails have accounts without going through the rate-limited reset endpoint.

create or replace function public.auth_email_exists(p_email text)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    where lower(u.email) = lower(trim(p_email))
      and u.deleted_at is null
  );
$$;

revoke execute on function public.auth_email_exists(text) from public, anon, authenticated;
grant execute on function public.auth_email_exists(text) to service_role;
