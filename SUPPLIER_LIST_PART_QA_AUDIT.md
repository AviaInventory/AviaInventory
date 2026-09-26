# AviaInventory — Senior QA Audit
## Supplier “List a Part for Sale” workflow

**Audit scope:** Supplier Dashboard → Inventory → Add Part → Part Identification → Classification → Condition & Traceability → Commercial Terms → Certification → Documents/Photos → Review → Publish → Marketplace → Edit Listing → Deactivate Listing.

**Target responsive widths:** 375px mobile, 768px tablet, desktop.

**Audit method:** source-code inspection, schema/migration inspection, static control-flow review, security-boundary review, responsive/semantic review, and TypeScript/JSX transpilation checks on modified workflow files. A live Supabase environment and browser session were not available in the package, so live RLS/storage/network execution was not claimed.

## Executive result

The workflow had several release-blocking defects despite the strong aviation-specific UX direction already present. The most important were:

1. `AddPartForm.validateCurrentStep()` accidentally returned the Commercial Terms JSX instead of a boolean, so the step could bypass validation and the control-flow contract was broken.
2. The commercial UI existed twice in the component, with an older non-collapsed version reachable from `renderStep()` and a newer version embedded in validation logic. This violated the intended single authoritative workflow.
3. Create/publish inserted a listing directly as `Published`, bypassing the lifecycle transition function and its audit history.
4. Existing listing assets were deleted from Supabase immediately when the supplier clicked Remove, before Save. This made editing destructive and made Cancel/abandonment unsafe.
5. Supporting-document reconciliation deleted all canonical rows before re-inserting them, creating a data-loss window if the insert failed.
6. A supplier could attach an image/document metadata row to another supplier’s part ID because the asset RLS policies checked only `supplier_id`, not ownership of `part_id`.
7. Private supporting documents had no storage SELECT policy, so the edit UI’s signed-URL View operation could fail even when the metadata row was readable.
8. Certification deletion was too permissive: a supplier could remove reviewed/verified evidence. The workflow now retains reviewed evidence.
9. Published/transactional listings could be materially edited without a business-history guard. The updated server path protects Reserved/Sold/Archived listings and any listing with RFQ/quote/order/shipment/invoice history.
10. There was no durable draft recovery beyond an in-memory dirty state and `beforeunload`; the revised wizard now autosaves non-file form data locally and restores it per authenticated user/listing.
11. Duplicate serialized listings were not checked. A server-side duplicate guard now blocks another active/draft listing for the same supplier, part number and serial number while allowing non-serialized batches/lots.
12. The supplier detail page used browser `alert()` for lifecycle errors; this has been replaced with accessible toast/error feedback.

## 25-point QA matrix

| # | Area | Finding | Revision |
|---|---|---|---|
| 1 | UX | The workflow is aviation-specific and uses a clear progressive sequence, but commercial controls had duplicated implementations. | Kept one authoritative Commercial Terms render and validation path; Advanced commercial terms is collapsed. |
| 2 | UI | Commercial pricing could become ambiguous because legacy “Unit Price” UI conflicted with the newer pricing model. | UI now clearly distinguishes Fixed, Negotiable, Request Quote, Per Unit and Per Lot. |
| 3 | Aviation domain | Condition, TSN/TSO, ATA, applicability, traceability, certification and hazmat concepts are appropriate. | Added stronger numeric/date validation and explicit certification verification boundaries. |
| 4 | Data integrity | Create could publish directly instead of following Draft → Published lifecycle. | Create now persists as Draft first; publication uses `transition_listing_status`. |
| 5 | Validation | Commercial step validation was structurally broken because validation returned JSX. | Replaced with boolean-only validation and explicit quantity, MOQ, lot, price, currency, availability and location checks. |
| 6 | Accessibility | `Field` labels were visually associated but not programmatically linked to controls. | Field controls now receive stable IDs and `aria-describedby` for hints where the child is a labelable form control. |
| 7 | Mobile 375px | Wizard progress is horizontally scrollable and controls use touch-sized targets. The old sticky step header could cover persistent mobile navigation. | Listing wizard sticky header now sits below the mobile navigation at 375px (`top-[121px]`) and returns to `top-0` on desktop. |
| 8 | Tablet 768px | Grid/table patterns are generally suitable; long tables use horizontal scrolling. | Preserved responsive table behavior and kept two-column form layout only above the mobile breakpoint. |
| 9 | Desktop | Desktop form has clear two-column information density and a focused review state. | Preserved layout while removing duplicated commercial UI. |
| 10 | Keyboard | Lifecycle modal supported Escape but did not trap focus. | Added initial focus and Tab/Shift+Tab focus trapping, with focus restoration on close. |
| 11 | Screen reader | Validation relied mainly on toast feedback. | Added an assertive in-page validation alert; form hints are associated with controls where possible. |
| 12 | Error handling | Some lifecycle errors used `window.alert`. | Replaced supplier-detail lifecycle alerts with toast feedback; upload/save errors remain surfaced and logged. |
| 13 | Loading | Inventory used a plain “Loading inventory…” state. | Added skeleton rows with `aria-busy` and a descriptive label. |
| 14 | Upload failures | Upload helpers cleaned already-uploaded files, but asset DB rows could remain after later reconciliation failures. | New uploaded image/document metadata is removed during rollback; storage cleanup remains best-effort. |
| 15 | Draft persistence | Dirty state did not survive route/browser loss. | Added per-user, per-listing local draft recovery for form fields and step position. Explicit Save Draft remains the durable persistence mechanism for files. |
| 16 | Duplicate listings | No serialized-item duplicate guard existed. | Added server-side active/draft duplicate detection for same supplier + part number + serial number. Non-serialized batches remain allowed. |
| 17 | Certification | Supplier declaration, upload, review and verification were separated conceptually, but supplier deletion was too broad. | Reviewed certification evidence is retained; only Not reviewed/Pending + Not verified evidence can be removed by the supplier. |
| 18 | Supplier verification boundaries | Listing-document verification is separate from supplier verification. | Preserved and reinforced this boundary in UI/schema. |
| 19 | RLS/security | Asset metadata ownership checked the asset supplier but not the linked part owner. | Added ownership-aware image/document RLS policies and blocked direct `parts` DELETE for authenticated users. |
| 20 | Marketplace visibility | Marketplace server queries already required `status = Published`. | Preserved this rule and made create/publish lifecycle consistent with it. |
| 21 | Listing lifecycle | Lifecycle model is Draft/Published/Reserved/Sold/Inactive/Archived with guarded transitions. | Publication now uses the transition RPC even for newly-created listings. |
| 22 | Edit behavior | Asset removal was immediate and transactional listings could be materially edited. | Asset removal is now staged until Save; server update rejects protected/transactional listings. |
| 23 | Delete/archive | Hard delete is intended only for clean Draft listings, but direct table deletion was a bypass risk. | Revoked authenticated table DELETE and retained the controlled clean-draft RPC; reviewed certification evidence also prevents clean deletion. |
| 24 | Performance | Some reads used `select('*')`; marketplace SEO path can fetch up to 500 rows and then filter certification/country in application memory. | Added targeted supplier indexes and reduced duplicate certification-register fetches. Remaining marketplace optimization is noted below. |
| 25 | Supabase efficiency | Asset reads were reasonably indexed; lifecycle uses one security-definer RPC that checks five business-history sources. | Added supplier/status and published lookup indexes, asset ownership checks, storage limits, and a single initial certification-document data load in the wizard. |

## Detailed workflow trace

### 1. Supplier Dashboard

**Source reviewed:** `components/supplier/dashboard/SupplierOperationsDashboard.tsx`.

**Issue fixed:** the dashboard’s “attention” logic treated `unit_price = 0` as missing, which is wrong for the new Request Quote model. It now checks `price_type !== 'request_quote' && unit_price === null` instead.

**QA note:** dashboard loading already uses a skeleton pattern. Inventory counts are supplier-scoped.

### 2. Inventory

**Source reviewed:** `components/supplier/InventoryTable.tsx`.

**Issues fixed:**
- Replaced plain loading text with skeleton rows.
- Lifecycle actions remain modal-driven instead of browser `confirm()`.
- Price column correctly renders `Request a Quote`, negotiable amounts, or explicit unit/lot basis.

### 3. Add Part / wizard control flow

**Source reviewed:** `components/supplier/AddPartForm.tsx`.

**Release blocker fixed:** the original `validateCurrentStep()` Commercial Terms branch returned a React `<section>` instead of returning a boolean validation result. The same commercial form then existed again inside `renderStep()`. The revised file has a boolean validation function and a single rendered Commercial Terms section.

**Result:** Next/Back navigation and publish-time validation now have predictable control flow.

### 4. Part Identification

The required fields remain Part Number, Buyer-facing Description and Manufacturer. Part number guidance explicitly discourages mixing quantity/condition into the identifier.

**Duplicate control:** serialized listings now run a server-side duplicate check before create/update. This is intentionally not a global part-number uniqueness rule because aviation suppliers can legitimately hold multiple non-serialized batches/lots of the same part.

### 5. Classification & Compatibility

Category remains required. ATA, aircraft and engine applicability remain supplier-provided fields and are not represented as independently verified.

### 6. Condition & Traceability

Condition remains required. TSN and TSO now reject negative/non-numeric values when supplied. Shelf-life expiry cannot be in the past during publish validation.

### 7. Commercial Terms

The authoritative model is:

- Fixed price
- Negotiable price
- Request Quote
- Per unit
- Per lot
- Units per lot
- MOQ
- Currency
- Availability
- Stock location
- Lead time
- Optional advanced Incoterms, payment terms and price-valid-until

**Additional integrity rules:**
- Quantity must be a positive whole number.
- MOQ must be a positive whole number and cannot exceed available quantity.
- Lot size must be a positive whole number and cannot exceed quantity.
- For lot pricing, MOQ must be one or more complete lots.
- Request Quote must not carry a numeric displayed price.
- Currency and availability are constrained to the supported UI values.

### 8. Certification

The workflow preserves four distinct states:

1. Supplier declaration
2. Technical upload result
3. AviaInventory review state
4. AviaInventory verification outcome

Only the platform review workflow can produce Verified. Public buyers receive only safe verified metadata through the public certification RPC.

**Deletion hardening:** reviewed certification evidence is retained. Suppliers can remove only unreviewed/pending, not-verified evidence.

### 9. Supporting Documents and Photos

**Asset staging fix:** removing an existing image/document now changes the local edit state rather than deleting the database/storage object immediately. The supplier must Save Changes to apply the removal.

This prevents accidental data loss when the supplier abandons an edit session.

**Storage:** image and document buckets now have server-side file-size/MIME restrictions in addition to UI checks.

### 10. Review

Buyer preview remains the final presentation gate. The publication modal explicitly confirms that supplier declarations and uploaded files do not automatically become AviaInventory-verified.

### 11. Publish

**Critical lifecycle fix:** newly-created listings are first stored as Draft. If the supplier confirms Publish, the application then calls the guarded `transition_listing_status` RPC to move Draft → Published.

This keeps publication consistent with the lifecycle model and creates the status-history event.

### 12. Marketplace

Marketplace data already requires `Published`. Draft, Inactive, Reserved, Sold and Archived listings therefore remain outside ordinary marketplace discovery.

### 13. Edit Listing

Editable listings without business history can still be maintained.

Protected states:
- Reserved
- Sold
- Archived

Additionally, a listing with RFQ, quote, order, shipment or invoice history is protected from material content edits. This prevents commercial/identity changes from rewriting a record that already participates in a business workflow.

### 14. Deactivate

Published → Inactive remains the non-destructive removal path. The listing disappears from marketplace discovery while its record is preserved.

### 15. Delete / Archive

Permanent deletion is limited to a clean Draft with no transaction history and no reviewed certification evidence.

Authenticated users no longer receive direct DELETE permission on `public.parts`; the controlled `hard_delete_clean_draft_listing` function is the deletion boundary.

## Supabase security review

### Parts table

The hardening migration:
- enables RLS;
- requires supplier ownership for supplier writes;
- provides public visibility only for Published listings;
- adds restrictive visibility/write boundaries so older permissive policies cannot widen access;
- revokes authenticated DELETE permission;
- adds supplier/status and published lookup indexes.

### Listing images/documents

Asset policies now verify both:
- the asset row’s `supplier_id`, and
- the linked `parts.supplier_id`.

Supplier asset modification is also blocked for Sold/Archived listings.

### Supporting-document storage

Private `documents` storage now has an authenticated owner SELECT policy, which is required for the existing signed-URL View operation.

### Certification storage

Certification storage remains private. Public buyers never receive private document URLs; the public RPC exposes only verified, unexpired certification metadata.

## Remaining non-blocking observations

1. **True byte-level upload progress:** current progress is completed-file based, not byte-based. This is honest and preferable to fake progress, but a resumable uploader could improve large-file UX later.
2. **Marketplace certification filtering:** the SEO marketplace query can fetch a broad candidate set and then filter verified certification types in application memory. A database view/materialized facet strategy would scale better for very large inventory volumes.
3. **Marketplace rating:** the current marketplace server path still exposes `supplier_rating: null` in this package rather than computing live ratings there. This is outside the core List-a-Part write path but should be wired before rating-based marketplace sort is considered production-complete.
4. **Asset cleanup:** storage deletion after successful DB deletion is still a two-system operation. Failed storage cleanup can leave an orphaned object; a scheduled cleanup job would provide eventual consistency.
5. **Live browser/RLS execution:** this package was not connected to a live Supabase project during this audit, so the migration SQL should still be exercised in staging with representative RLS/storage tests before production deployment.
6. **Unsaved local files:** browser local draft recovery intentionally persists form fields, not binary `File` objects. Suppliers should use Save Draft before leaving if they need uploaded files to survive a browser restart.

## Static verification performed

The revised workflow files were transpiled with TypeScript 5.8.3 in JSX/ES2022 mode without syntax diagnostics:

- `components/supplier/AddPartForm.tsx`
- `components/supplier/EditPartForm.tsx`
- `components/supplier/ListingAssetManager.tsx`
- `components/supplier/ListingCertificationDocuments.tsx`
- `components/supplier/ListingLifecycleModal.tsx`
- `components/supplier/InventoryTable.tsx`
- `components/supplier/SupplierPartDetails.tsx`
- `components/supplier/dashboard/SupplierOperationsDashboard.tsx`
- `lib/parts.ts`

A full `next build` could not be completed in the audit container because the extracted package did not have a complete installed dependency tree (`next` was not available in the final executable path after the timed-out dependency installation). Therefore no claim of a successful production build is made here.
