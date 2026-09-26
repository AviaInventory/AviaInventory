# AviaInventory Supplier Verification & Compliance

## Supplier states

`Draft` → `Submitted` → `Under Review` → `More Information Required` / `Verified`.

Additional controlled states: `Suspended` and `Rejected`.

Suppliers can submit their own profile but cannot self-assign `Verified`, `Suspended`, or `Rejected`.

## Verification center

Supplier route: `/supplier/verification`

The center shows:
- verification status and readiness percentage
- company information
- identity/contact
- business registration
- aviation certifications
- quality certifications
- supporting documents
- expiry monitoring
- reviewer comments
- missing information/actions

## Private documents

The migration creates a private Storage bucket named `supplier-verification-documents`. Object paths are scoped to the supplier UUID and protected by Storage RLS. Document rows are protected by table RLS. Public supplier pages only receive verification status metadata; they do not query compliance documents or reviewer notes.

The supplier can upload, view through a short-lived signed URL, and replace a document. Replacements increment the version and mark the previous record `Replaced`.

## Expiry handling

The UI flags expired documents and documents expiring within 30 days, with a secondary 90-day warning state. The verification summary RPC returns expiry counts for dashboard alerts.

For automated email/SMS notifications, connect the same summary query to a scheduled Supabase Edge Function/cron job in the production environment. No notification service credentials are stored in the application.

## Supabase deployment

Apply:

`supabase/migrations/20260917_supplier_verification_compliance.sql`

The migration is designed to be additive and creates the verification metadata, document register, private Storage bucket, RLS policies, supplier submission RPC, admin review RPC, and summary RPC.

## Listing-level certification verification

Listing certification evidence is intentionally separate from supplier verification. `public.part_certification_documents` is keyed to `part_id` and carries its own `verification_status`, `reviewed_by/reviewed_at`, and `verified_by/verified_at` fields. Supplier-level status remains `suppliers.verification_status` and is not changed by listing-document review.

Suppliers can declare a document type and upload files, but the listing-document RLS policy only permits supplier inserts in `Pending` state. Updates to listing-document review state are platform-admin-only. The `review_part_certification_document` RPC is the controlled reviewer transition.

Supported listing document declarations: FAA 8130-3, EASA Form 1, Dual Release, Certificate of Conformity, OEM documentation, Other, and No certification document. The last option is a declaration only and does not create a document row.

## Listing certification workflow v2

Listing certification evidence uses four separate concepts:

1. **Supplier declaration** — `document_type` records what the supplier says the file represents.
2. **Upload status** — `upload_status` records whether the file transfer succeeded; an uploaded file is not automatically trusted.
3. **AviaInventory review** — `review_status` records `Not reviewed`, `Pending review`, `Under review`, or `Reviewed`.
4. **AviaInventory verification outcome** — `verification_status` records `Not verified`, `Verified`, `Rejected`, `Expired`, or `Replaced`.

`Verified` is only reachable after `Reviewed` and requires a reviewer identity and timestamp. Supplier RLS does not permit suppliers to update listing certification review or verification fields.

The dedicated platform console uses an administrator session separate from supplier authentication. Console review actions record an administrator audit identity and append a review event; no fake `auth.users` UUID is created for the console administrator.

Supported declarations are FAA 8130-3, EASA Form 1, Dual Release, Certificate of Conformity, OEM documentation, Other, and No certification document. The last option is a supplier declaration and does not create a certification-document row.

Listing certification verification never changes `suppliers.verification_status`. Supplier verification and listing-document verification must be evaluated independently.
