-- AviaInventory Supplier Verification & Compliance
-- Private documents remain in a private Supabase Storage bucket.

alter table public.suppliers
  add column if not exists verification_status text not null default 'Draft',
  add column if not exists verification_completion integer not null default 0,
  add column if not exists verification_comments text,
  add column if not exists verification_missing_information text[] not null default array[]::text[],
  add column if not exists verification_submitted_at timestamptz,
  add column if not exists verification_reviewed_at timestamptz;

alter table public.suppliers drop constraint if exists suppliers_verification_status_check;
alter table public.suppliers add constraint suppliers_verification_status_check
  check (verification_status in ('Draft','Submitted','Under Review','More Information Required','Verified','Suspended','Rejected'));

alter table public.suppliers drop constraint if exists suppliers_verification_completion_check;
alter table public.suppliers add constraint suppliers_verification_completion_check
  check (verification_completion between 0 and 100);

create index if not exists suppliers_verification_status_idx
  on public.suppliers(verification_status);

create table if not exists public.supplier_verification_documents (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  document_type text not null,
  document_name text not null,
  issue_date date,
  expiry_date date,
  issuing_authority text,
  verification_status text not null default 'Pending',
  storage_path text not null unique,
  version integer not null default 1 check (version > 0),
  reviewer_notes text,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_verification_documents_status_check
    check (verification_status in ('Pending','Under Review','Verified','Rejected','Expired','Replaced'))
);

create index if not exists supplier_verification_documents_supplier_idx
  on public.supplier_verification_documents(supplier_id, created_at desc);
create index if not exists supplier_verification_documents_expiry_idx
  on public.supplier_verification_documents(expiry_date);

create or replace function public.set_supplier_verification_document_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists supplier_verification_documents_updated_at on public.supplier_verification_documents;
create trigger supplier_verification_documents_updated_at
before update on public.supplier_verification_documents
for each row execute function public.set_supplier_verification_document_updated_at();

alter table public.supplier_verification_documents enable row level security;

-- A small security-definer helper prevents policy recursion when checking admin roles.
create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and ('admin' = any(coalesce(p.account_roles, array[]::text[])) or p.account_type = 'admin')
  );
$$;

grant execute on function public.is_platform_admin() to authenticated;

-- Suppliers can only see and manage their own compliance records. Platform admins can review them.
drop policy if exists "Suppliers can view own verification documents" on public.supplier_verification_documents;
create policy "Suppliers can view own verification documents"
  on public.supplier_verification_documents for select to authenticated
  using (supplier_id = auth.uid() or public.is_platform_admin());

drop policy if exists "Suppliers can upload own verification documents" on public.supplier_verification_documents;
create policy "Suppliers can upload own verification documents"
  on public.supplier_verification_documents for insert to authenticated
  with check (supplier_id = auth.uid() and uploaded_by = auth.uid());

drop policy if exists "Suppliers can replace own verification documents" on public.supplier_verification_documents;
create policy "Suppliers can replace own verification documents"
  on public.supplier_verification_documents for update to authenticated
  using (supplier_id = auth.uid() or public.is_platform_admin())
  with check (supplier_id = auth.uid() or public.is_platform_admin());

drop policy if exists "Admins can review verification documents" on public.supplier_verification_documents;
create policy "Admins can review verification documents"
  on public.supplier_verification_documents for delete to authenticated
  using (public.is_platform_admin());

-- Only status/completion metadata is intended to be public; document rows are never public.
-- Existing supplier RLS remains authoritative for who can read supplier company data.

drop policy if exists "Suppliers can update own verification metadata" on public.suppliers;
create policy "Suppliers can update own verification metadata"
  on public.suppliers for update to authenticated
  using (id = auth.uid() or public.is_platform_admin())
  with check (id = auth.uid() or public.is_platform_admin());

-- Private compliance bucket. Object paths must start with the authenticated supplier UUID.
insert into storage.buckets (id, name, public)
values ('supplier-verification-documents', 'supplier-verification-documents', false)
on conflict (id) do update set public = false;

drop policy if exists "Supplier verification documents are private" on storage.objects;
create policy "Supplier verification documents are private"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'supplier-verification-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_platform_admin())
  );

drop policy if exists "Suppliers upload verification documents to own folder" on storage.objects;
create policy "Suppliers upload verification documents to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'supplier-verification-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Suppliers update verification documents in own folder" on storage.objects;
create policy "Suppliers update verification documents in own folder"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'supplier-verification-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_platform_admin())
  )
  with check (
    bucket_id = 'supplier-verification-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_platform_admin())
  );

drop policy if exists "Suppliers delete verification documents in own folder" on storage.objects;
create policy "Suppliers delete verification documents in own folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'supplier-verification-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_platform_admin())
  );

-- Supplier submission is intentionally one-way from the supplier UI: it can submit a draft,
-- but cannot mark itself Verified, Suspended, or Rejected.
create or replace function public.submit_supplier_verification()
returns public.suppliers
language plpgsql
security definer
set search_path = public
as $$
declare v_supplier public.suppliers%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.suppliers
    set verification_status = 'Submitted',
        verification_submitted_at = now()
  where id = auth.uid()
    and verification_status in ('Draft','More Information Required','Rejected');
  select * into v_supplier from public.suppliers where id = auth.uid();
  if not found then raise exception 'Supplier profile not found'; end if;
  return v_supplier;
end;
$$;

grant execute on function public.submit_supplier_verification() to authenticated;

-- Admin workflow helper. Application/admin tooling can use this RPC without exposing service-role keys.
create or replace function public.review_supplier_verification(
  p_supplier_id uuid,
  p_status text,
  p_completion integer default null,
  p_comments text default null,
  p_missing_information text[] default null
)
returns public.suppliers
language plpgsql
security definer
set search_path = public
as $$
declare v_supplier public.suppliers%rowtype;
begin
  if not public.is_platform_admin() then raise exception 'Platform administrator access required'; end if;
  if p_status not in ('Draft','Submitted','Under Review','More Information Required','Verified','Suspended','Rejected') then
    raise exception 'Invalid verification status';
  end if;
  update public.suppliers
    set verification_status = p_status,
        verification_completion = coalesce(p_completion, verification_completion),
        verification_comments = p_comments,
        verification_missing_information = coalesce(p_missing_information, verification_missing_information),
        verification_reviewed_at = case when p_status in ('Under Review','More Information Required','Verified','Suspended','Rejected') then now() else verification_reviewed_at end
  where id = p_supplier_id
  returning * into v_supplier;
  if not found then raise exception 'Supplier not found'; end if;
  return v_supplier;
end;
$$;

grant execute on function public.review_supplier_verification(uuid,text,integer,text,text[]) to authenticated;

-- Refresh expired document state whenever the supplier/admin reads the record through this helper.
create or replace function public.get_supplier_verification_summary(p_supplier_id uuid default auth.uid())
returns table(
  verification_status text,
  verification_completion integer,
  verification_comments text,
  verification_missing_information text[],
  document_count bigint,
  verified_document_count bigint,
  expiring_document_count bigint,
  expired_document_count bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select s.verification_status,
         s.verification_completion,
         s.verification_comments,
         s.verification_missing_information,
         count(d.id)::bigint,
         count(d.id) filter (where d.verification_status = 'Verified')::bigint,
         count(d.id) filter (where d.expiry_date is not null and d.expiry_date between current_date and current_date + 30)::bigint,
         count(d.id) filter (where d.expiry_date is not null and d.expiry_date < current_date)::bigint
  from public.suppliers s
  left join public.supplier_verification_documents d on d.supplier_id = s.id and d.verification_status <> 'Replaced'
  where s.id = p_supplier_id
    and (s.id = auth.uid() or public.is_platform_admin())
  group by s.id;
$$;

grant execute on function public.get_supplier_verification_summary(uuid) to authenticated;

-- Extend the public supplier summary RPC with verification metadata (never document data).
drop function if exists public.get_public_supplier_summaries(integer);
create function public.get_public_supplier_summaries(result_limit integer default 3)
returns table(
  id uuid,
  company_name text,
  country text,
  city text,
  listing_count bigint,
  average_rating numeric,
  review_count bigint,
  logo_url text,
  verification_status text
)
language sql
security definer
set search_path = public
stable
as $$
  with active_listings as (
    select p.supplier_id, count(*)::bigint as listing_count
    from public.parts p where p.status = 'Published' group by p.supplier_id
  ), review_summary as (
    select sr.supplier_id, round(avg(sr.rating)::numeric, 1) as average_rating, count(*)::bigint as review_count
    from public.supplier_reviews sr where sr.is_published = true group by sr.supplier_id
  )
  select s.id, coalesce(s.company_name, 'Supplier') as company_name, pr.country, s.city,
         al.listing_count, rs.average_rating, coalesce(rs.review_count, 0)::bigint, null::text,
         coalesce(s.verification_status, 'Draft')
  from public.suppliers s
  join active_listings al on al.supplier_id = s.id
  left join public.profiles pr on pr.id = s.id
  left join review_summary rs on rs.supplier_id = s.id
  order by al.listing_count desc, s.company_name asc
  limit greatest(coalesce(result_limit, 3), 0);
$$;

grant execute on function public.get_public_supplier_summaries(integer) to anon, authenticated;
