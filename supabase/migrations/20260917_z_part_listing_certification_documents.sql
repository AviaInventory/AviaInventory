-- AviaInventory listing-level certification/document register.
-- IMPORTANT: supplier-level verification remains on suppliers.verification_status.
-- This table is intentionally scoped to one part listing and has independent review controls.

create table if not exists public.part_certification_documents (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.parts(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  document_type text not null,
  filename text not null,
  storage_path text not null unique,
  upload_status text not null default 'Uploaded',
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  uploaded_at timestamptz not null default now(),
  verification_status text not null default 'Pending',
  expiry_date date,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  reviewer_notes text,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint part_certification_documents_type_check check (
    document_type in ('FAA 8130-3','EASA Form 1','Dual Release','Certificate of Conformity','OEM documentation','Other')
  ),
  constraint part_certification_documents_upload_status_check check (upload_status in ('Uploaded','Upload Failed')),
  constraint part_certification_documents_verification_status_check check (verification_status in ('Pending','Under Review','Verified','Rejected','Expired','Replaced')),
  constraint part_certification_documents_no_verify_without_reviewer check (
    verification_status <> 'Verified' or verified_by is not null
  )
);

create index if not exists part_certification_documents_part_idx
  on public.part_certification_documents(part_id, created_at desc);
create index if not exists part_certification_documents_supplier_idx
  on public.part_certification_documents(supplier_id, created_at desc);
create index if not exists part_certification_documents_expiry_idx
  on public.part_certification_documents(expiry_date);

create or replace function public.set_part_certification_document_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists part_certification_documents_updated_at on public.part_certification_documents;
create trigger part_certification_documents_updated_at
before update on public.part_certification_documents
for each row execute function public.set_part_certification_document_updated_at();

alter table public.part_certification_documents enable row level security;

drop policy if exists "Suppliers can view own listing certification documents" on public.part_certification_documents;
create policy "Suppliers can view own listing certification documents"
  on public.part_certification_documents for select to authenticated
  using (supplier_id = auth.uid() or public.is_platform_admin());

drop policy if exists "Suppliers can upload listing certification documents" on public.part_certification_documents;
create policy "Suppliers can upload listing certification documents"
  on public.part_certification_documents for insert to authenticated
  with check (
    supplier_id = auth.uid()
    and uploaded_by = auth.uid()
    and exists (select 1 from public.parts p where p.id = part_id and p.supplier_id = auth.uid())
    and upload_status = 'Uploaded'
    and verification_status = 'Pending'
    and verified_by is null
  );

-- Suppliers cannot update verification fields. Replacements are represented by a new row.
drop policy if exists "Suppliers cannot alter listing certification review state" on public.part_certification_documents;
create policy "Suppliers cannot alter listing certification review state"
  on public.part_certification_documents for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Admin-only review transition. This keeps listing certification verification separate
-- from suppliers.verification_status and prevents client-side self-verification.
create or replace function public.review_part_certification_document(
  p_document_id uuid,
  p_status text,
  p_expiry_date date default null,
  p_reviewer_notes text default null
)
returns public.part_certification_documents
language plpgsql
security definer
set search_path = public
as $$
declare v_doc public.part_certification_documents%rowtype;
begin
  if not public.is_platform_admin() then raise exception 'Platform administrator access required'; end if;
  if p_status not in ('Pending','Under Review','Verified','Rejected','Expired','Replaced') then raise exception 'Invalid document verification status'; end if;
  update public.part_certification_documents
  set verification_status = p_status,
      expiry_date = coalesce(p_expiry_date, expiry_date),
      reviewer_notes = p_reviewer_notes,
      reviewed_by = case when p_status in ('Under Review','Verified','Rejected','Expired') then auth.uid() else reviewed_by end,
      reviewed_at = case when p_status in ('Under Review','Verified','Rejected','Expired') then now() else reviewed_at end,
      verified_by = case when p_status = 'Verified' then auth.uid() when p_status in ('Pending','Under Review') then null else verified_by end,
      verified_at = case when p_status = 'Verified' then now() when p_status in ('Pending','Under Review') then null else verified_at end
  where id = p_document_id
  returning * into v_doc;
  if not found then raise exception 'Listing certification document not found'; end if;
  return v_doc;
end;
$$;

grant execute on function public.review_part_certification_document(uuid,text,date,text) to authenticated;

insert into storage.buckets (id, name, public)
values ('part-certification-documents','part-certification-documents',false)
on conflict (id) do update set public = false;

drop policy if exists "Suppliers can view own listing certification files" on storage.objects;
create policy "Suppliers can view own listing certification files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'part-certification-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_platform_admin())
  );

drop policy if exists "Suppliers can upload own listing certification files" on storage.objects;
create policy "Suppliers can upload own listing certification files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'part-certification-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Suppliers can delete own listing certification files" on storage.objects;
create policy "Suppliers can delete own listing certification files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'part-certification-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_platform_admin())
  );
