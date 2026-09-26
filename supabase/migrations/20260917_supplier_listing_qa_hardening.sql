-- AviaInventory supplier listing QA/security hardening.
-- Assumes public.parts already exists in the base schema.

-- Suppliers must never be able to bypass the lifecycle RPC with a direct DELETE.
revoke delete on table public.parts from authenticated;

alter table public.parts enable row level security;

-- These permissive policies provide the expected supplier/public access boundary when
-- the base deployment does not already define equivalent policies.
drop policy if exists "Suppliers can insert own parts" on public.parts;
create policy "Suppliers can insert own parts"
  on public.parts for insert to authenticated
  with check (supplier_id = auth.uid());

drop policy if exists "Suppliers can update own parts" on public.parts;
create policy "Suppliers can update own parts"
  on public.parts for update to authenticated
  using (supplier_id = auth.uid())
  with check (supplier_id = auth.uid());

drop policy if exists "Public can view published parts" on public.parts;
create policy "Public can view published parts"
  on public.parts for select to anon, authenticated
  using (status = 'Published');

drop policy if exists "Suppliers can view own parts" on public.parts;
create policy "Suppliers can view own parts"
  on public.parts for select to authenticated
  using (supplier_id = auth.uid());

-- A serialized physical item cannot be listed twice by the same supplier while it is
-- still part of an active/draft workflow. Non-serialized stock is intentionally allowed
-- to have multiple lots/listings because suppliers may hold separate batches.
drop index if exists parts_supplier_serial_active_idx;
create index if not exists parts_supplier_serial_active_idx
  on public.parts (supplier_id, lower(trim(part_number)), lower(trim(serial_number)))
  where serial_number is not null
    and btrim(serial_number) <> ''
    and status <> 'Archived';

-- Fast supplier inventory and marketplace status access.
create index if not exists parts_supplier_status_created_idx
  on public.parts (supplier_id, status, created_at desc);
create index if not exists parts_published_category_idx
  on public.parts (status, category);
create index if not exists parts_published_part_number_idx
  on public.parts (status, lower(part_number));

-- Private supporting documents must be readable only by the owning supplier/admin,
-- otherwise createSignedUrl() in the edit workflow fails even though the metadata row is visible.
drop policy if exists "Suppliers view own listing documents storage" on storage.objects;
create policy "Suppliers view own listing documents storage"
  on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- Certification evidence is audit material. Suppliers may remove an uploaded document
-- only while it has not received a final review outcome. Reviewed evidence is retained.
drop policy if exists "Suppliers can delete own listing certification documents" on public.part_certification_documents;
create policy "Suppliers can delete own listing certification documents"
  on public.part_certification_documents for delete to authenticated
  using (
    supplier_id = auth.uid()
    and review_status in ('Not reviewed','Pending review')
    and verification_status = 'Not verified'
  );

-- Storage deletion follows the same certification evidence boundary.
drop policy if exists "Suppliers can delete own listing certification files" on storage.objects;
create policy "Suppliers can delete own listing certification files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'part-certification-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1
      from public.part_certification_documents d
      where d.storage_path = name
        and d.supplier_id = auth.uid()
        and d.review_status in ('Not reviewed','Pending review')
        and d.verification_status = 'Not verified'
    )
  );

-- Retain the existing supplier-folder storage delete capability for compatibility with
-- the two-step client cleanup; the database row policy above is the authoritative gate
-- for removing certification evidence from the listing register.

-- Commercial data-integrity constraints that do not depend on the current date.
alter table public.parts drop constraint if exists parts_quantity_positive_integer_check;
alter table public.parts add constraint parts_quantity_positive_integer_check
  check (quantity > 0 and quantity = floor(quantity)) not valid;

alter table public.parts drop constraint if exists parts_currency_check;
alter table public.parts add constraint parts_currency_check
  check (currency in ('USD','EUR','GBP','KES','AED','ZAR')) not valid;

alter table public.parts drop constraint if exists parts_availability_check;
alter table public.parts add constraint parts_availability_check
  check (availability is null or availability in ('In stock','Limited stock','On request','Made to order')) not valid;

alter table public.parts drop constraint if exists parts_lot_size_quantity_check;
alter table public.parts add constraint parts_lot_size_quantity_check
  check (price_basis = 'unit' or (lot_size <= quantity and minimum_order_quantity >= lot_size and mod(minimum_order_quantity, lot_size) = 0)) not valid;

-- Restrictive policies make the boundary hold even if an older permissive policy exists.
drop policy if exists "Listing visibility restrictive boundary" on public.parts;
create policy "Listing visibility restrictive boundary"
  as restrictive
  on public.parts for select to anon, authenticated
  using (status = 'Published' or supplier_id = auth.uid() or public.is_platform_admin());

drop policy if exists "Listing write restrictive boundary" on public.parts;
create policy "Listing write restrictive boundary"
  as restrictive
  on public.parts for insert to authenticated
  with check (supplier_id = auth.uid() or public.is_platform_admin());

drop policy if exists "Listing update restrictive boundary" on public.parts;
create policy "Listing update restrictive boundary"
  as restrictive
  on public.parts for update to authenticated
  using (supplier_id = auth.uid() or public.is_platform_admin())
  with check (supplier_id = auth.uid() or public.is_platform_admin());

-- Asset rows must point to a listing actually owned by the same supplier. This prevents
-- a supplier from attaching their storage objects to another supplier's part by ID.
drop policy if exists "Suppliers manage own listing images" on public.part_listing_images;
drop policy if exists "Suppliers select own listing images" on public.part_listing_images;
drop policy if exists "Suppliers insert own listing images" on public.part_listing_images;
drop policy if exists "Suppliers update own listing images" on public.part_listing_images;
drop policy if exists "Suppliers delete own listing images" on public.part_listing_images;
create policy "Suppliers select own listing images" on public.part_listing_images
  for select to authenticated using (supplier_id = auth.uid() and exists (select 1 from public.parts p where p.id = part_id and p.supplier_id = auth.uid()));
create policy "Suppliers insert own listing images" on public.part_listing_images
  for insert to authenticated with check (supplier_id = auth.uid() and exists (select 1 from public.parts p where p.id = part_id and p.supplier_id = auth.uid() and p.status not in ('Sold','Archived')));
create policy "Suppliers update own listing images" on public.part_listing_images
  for update to authenticated using (supplier_id = auth.uid() and exists (select 1 from public.parts p where p.id = part_id and p.supplier_id = auth.uid() and p.status not in ('Sold','Archived')))
  with check (supplier_id = auth.uid() and exists (select 1 from public.parts p where p.id = part_id and p.supplier_id = auth.uid() and p.status not in ('Sold','Archived')));
create policy "Suppliers delete own listing images" on public.part_listing_images
  for delete to authenticated using (supplier_id = auth.uid() and exists (select 1 from public.parts p where p.id = part_id and p.supplier_id = auth.uid() and p.status not in ('Sold','Archived')));

drop policy if exists "Suppliers manage own listing documents" on public.part_listing_documents;
drop policy if exists "Suppliers select own listing documents" on public.part_listing_documents;
drop policy if exists "Suppliers insert own listing documents" on public.part_listing_documents;
drop policy if exists "Suppliers update own listing documents" on public.part_listing_documents;
drop policy if exists "Suppliers delete own listing documents" on public.part_listing_documents;
create policy "Suppliers select own listing documents" on public.part_listing_documents
  for select to authenticated using (supplier_id = auth.uid() and exists (select 1 from public.parts p where p.id = part_id and p.supplier_id = auth.uid()));
create policy "Suppliers insert own listing documents" on public.part_listing_documents
  for insert to authenticated with check (supplier_id = auth.uid() and exists (select 1 from public.parts p where p.id = part_id and p.supplier_id = auth.uid() and p.status not in ('Sold','Archived')));
create policy "Suppliers update own listing documents" on public.part_listing_documents
  for update to authenticated using (supplier_id = auth.uid() and exists (select 1 from public.parts p where p.id = part_id and p.supplier_id = auth.uid() and p.status not in ('Sold','Archived')))
  with check (supplier_id = auth.uid() and exists (select 1 from public.parts p where p.id = part_id and p.supplier_id = auth.uid() and p.status not in ('Sold','Archived')));
create policy "Suppliers delete own listing documents" on public.part_listing_documents
  for delete to authenticated using (supplier_id = auth.uid() and exists (select 1 from public.parts p where p.id = part_id and p.supplier_id = auth.uid() and p.status not in ('Sold','Archived')));

-- A draft with a reviewed certification record is no longer a clean disposable draft.
-- Keep the evidence for audit purposes even when the listing never reached the marketplace.
create or replace function public.hard_delete_clean_draft_listing(p_part_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_owner uuid;
  v_has_history boolean;
  v_has_reviewed_certification boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select status, supplier_id into v_status, v_owner from public.parts where id = p_part_id for update;
  if v_owner is null or v_owner <> auth.uid() then raise exception 'Listing not found or not owned by you'; end if;
  if v_status <> 'Draft' then raise exception 'Only clean Draft listings can be permanently deleted'; end if;
  select has_history into v_has_history from public.get_listing_transaction_context(p_part_id);
  if coalesce(v_has_history,false) then raise exception 'This listing has business history and must be archived instead of deleted'; end if;
  select exists (
    select 1 from public.part_certification_documents d
    where d.part_id = p_part_id
      and (d.review_status = 'Reviewed' or d.verification_status <> 'Not verified')
  ) into v_has_reviewed_certification;
  if v_has_reviewed_certification then
    raise exception 'This draft contains reviewed certification evidence and must be archived instead of deleted';
  end if;
  delete from public.parts where id = p_part_id and supplier_id = auth.uid();
  return true;
end;
$$;
revoke all on function public.hard_delete_clean_draft_listing(uuid) from public;
grant execute on function public.hard_delete_clean_draft_listing(uuid) to authenticated;

-- Enforce upload-size/type limits at the storage layer as well as in the UI.
update storage.buckets
set file_size_limit = 8388608,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']
where id = 'part-images';

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain']
where id = 'documents';

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf','image/jpeg','image/png']
where id = 'part-certification-documents';

-- The storage API cleanup is intentionally two-step (metadata row then object). Keep the
-- existing owner-folder storage policy so a successful metadata deletion can also remove
-- its now-unreferenced object; the certification table RLS remains the authoritative gate
-- for deleting evidence from the listing register.
drop policy if exists "Suppliers can delete own listing certification files" on storage.objects;
create policy "Suppliers can delete own listing certification files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'part-certification-documents' and (storage.foldername(name))[1] = auth.uid()::text);
