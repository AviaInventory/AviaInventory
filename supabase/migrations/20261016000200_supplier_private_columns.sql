-- AviaInventory: stop exposing private supplier fields.
--
-- "Anyone can view supplier profiles" (USING true) let anyone, signed out included, read
-- every column of public.suppliers through the REST API: company address, registration
-- number and the admins' internal verification comments. Rows stay visible (the directory
-- needs them) but anon/authenticated may now select only the public columns. A supplier
-- reads their own private columns through get_my_supplier_private(); the platform console
-- uses the service role and security-definer functions, so it is unaffected.

revoke select on table public.suppliers from anon, authenticated;
grant select (
  id, company_name, business_type, website, city, supplier_categories,
  created_at, verification_status, verification_completion
) on table public.suppliers to anon, authenticated;

create or replace function public.get_my_supplier_private()
returns table (
  registration_number text,
  address text,
  verification_comments text,
  verification_missing_information text[],
  verification_submitted_at timestamptz,
  verification_reviewed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select s.registration_number, s.address, s.verification_comments,
         coalesce(s.verification_missing_information, array[]::text[]),
         s.verification_submitted_at, s.verification_reviewed_at
  from public.suppliers s
  where s.id = auth.uid();
$$;

revoke execute on function public.get_my_supplier_private() from public, anon;
grant execute on function public.get_my_supplier_private() to authenticated;
