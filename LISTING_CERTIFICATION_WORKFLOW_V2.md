# AviaInventory Listing Certification Workflow v2

This upgrade keeps supplier-level verification separate from listing-level certification evidence.

## Four states

- **Supplier declaration**: `document_type` says what the supplier declares the file to be.
- **Upload status**: `upload_status` records the technical file upload result.
- **Review status**: `review_status` records platform review progress.
- **Verification outcome**: `verification_status` records the AviaInventory decision.

A document cannot receive a final verification outcome until it is reviewed. Suppliers have no UPDATE policy for review/verification fields.

## Supported listing declarations

FAA 8130-3, EASA Form 1, Dual Release, Certificate of Conformity, OEM documentation, Other, and No certification document. No certification document is a declaration only and creates no document row.

## Buyer-facing safety

Marketplace certification badges are now sourced only from currently verified listing documents. A supplier-declared certification is shown as a declaration, not as an AviaInventory trust badge. Expired verified evidence is not exposed as a current verified certification.

## Supplier vs listing verification

`suppliers.verification_status` remains the company-level verification state. `part_certification_documents.*` remains listing-level evidence and review. Reviewing or verifying a listing document does not modify supplier verification.

## Admin review

The dedicated platform console now has `/admin/dashboard/listing-certifications`. The custom admin session is checked server-side; private document files are opened through short-lived signed URLs. Review actions record an admin audit identity and append a review event. No synthetic Supabase auth UUID is created for the platform-console administrator.
