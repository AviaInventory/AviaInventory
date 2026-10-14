-- AviaInventory: stop users from changing privileged columns on their own rows.
--
-- RLS decides *which rows* a user may update; it cannot restrict *which columns*.
-- The policy "Suppliers can update own verification metadata" let a supplier run
--   update suppliers set verification_status = 'Verified' where id = auth.uid();
-- and any profiles policy allowing own-row updates would let a user grant themselves
-- the admin role (is_platform_admin() trusts profiles.account_roles).
--
-- These triggers apply to direct API writes (current_user = authenticated/anon).
-- Security-definer RPCs (submit_supplier_verification, review_supplier_verification,
-- upgrade_to_hybrid_account, handle_new_auth_user) run as the function owner and
-- remain the only way to change these columns. Platform admins are also exempt.

create or replace function public.is_direct_client_write()
returns boolean
language sql
stable
as $$
  select current_user in ('authenticated', 'anon') and not public.is_platform_admin();
$$;

-- profiles: account_type and account_roles ------------------------------------------

create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  if not public.is_direct_client_write() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.account_type := 'buyer';
    new.account_roles := case
      when 'supplier' = any(coalesce(new.account_roles, array[]::text[])) then array['buyer','supplier']
      else array['buyer']
    end;
  else
    new.account_type := old.account_type;
    new.account_roles := old.account_roles;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_privileged_columns on public.profiles;
create trigger guard_profile_privileged_columns
before insert or update on public.profiles
for each row execute function public.guard_profile_privileged_columns();

-- suppliers: verification state -----------------------------------------------------

create or replace function public.guard_supplier_verification_columns()
returns trigger
language plpgsql
as $$
begin
  if public.is_direct_client_write() then
    new.verification_status := old.verification_status;
    new.verification_completion := old.verification_completion;
    new.verification_comments := old.verification_comments;
    new.verification_missing_information := old.verification_missing_information;
    new.verification_submitted_at := old.verification_submitted_at;
    new.verification_reviewed_at := old.verification_reviewed_at;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_supplier_verification_columns on public.suppliers;
create trigger guard_supplier_verification_columns
before update on public.suppliers
for each row execute function public.guard_supplier_verification_columns();

-- supplier_verification_documents: review state ---------------------------------------
-- Suppliers may upload documents and mark their own document 'Replaced' when uploading
-- a new version; everything else about the review belongs to platform admins.

create or replace function public.guard_supplier_document_review_columns()
returns trigger
language plpgsql
as $$
begin
  if not public.is_direct_client_write() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verification_status := 'Pending';
    new.reviewer_notes := null;
    new.reviewed_by := null;
    return new;
  end if;

  if new.verification_status is distinct from old.verification_status
     and new.verification_status <> 'Replaced' then
    raise exception 'Only AviaInventory can change a document''s verification status'
      using errcode = '42501';
  end if;

  new.reviewer_notes := old.reviewer_notes;
  new.reviewed_by := old.reviewed_by;
  new.supplier_id := old.supplier_id;
  new.uploaded_by := old.uploaded_by;
  return new;
end;
$$;

drop trigger if exists guard_supplier_document_review_columns on public.supplier_verification_documents;
create trigger guard_supplier_document_review_columns
before insert or update on public.supplier_verification_documents
for each row execute function public.guard_supplier_document_review_columns();

-- Rows that were self-verified before this migration are not changed automatically;
-- review them with supabase/audit/security_audit.sql.
