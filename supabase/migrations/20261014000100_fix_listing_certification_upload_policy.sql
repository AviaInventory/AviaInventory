-- AviaInventory: let suppliers attach certification documents to their listings again.
--
-- 20260917000700_listing_certification_workflow_v2 renamed the initial verification
-- status from 'Pending' to 'Not verified' (and its check constraint no longer allows
-- 'Pending'), but the insert policy from 20260917000500 still required 'Pending'.
-- Every upload was therefore rejected by RLS ("new row violates row-level security
-- policy for table part_certification_documents"), which failed listing creation.

drop policy if exists "Suppliers can upload listing certification documents" on public.part_certification_documents;
create policy "Suppliers can upload listing certification documents"
  on public.part_certification_documents for insert to authenticated
  with check (
    supplier_id = auth.uid()
    and uploaded_by = auth.uid()
    and exists (select 1 from public.parts p where p.id = part_id and p.supplier_id = auth.uid())
    and upload_status = 'Uploaded'
    and verification_status = 'Not verified'
    and review_status in ('Not reviewed', 'Pending review')
    and verified_by is null
  );
