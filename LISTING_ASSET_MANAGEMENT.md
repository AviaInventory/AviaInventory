# AviaInventory — Supplier Listing Asset Management

## What changed

- Added canonical `part_listing_images` records for listing image metadata, order, primary state, alt text and storage path.
- Added canonical `part_listing_documents` records for general supporting listing documents.
- Existing `image_urls` and `document_urls` remain for marketplace compatibility, but supplier edit flows now reconcile against the managed asset set instead of blindly appending new files.
- Existing legacy public image URLs and document paths are surfaced when canonical asset rows do not yet exist.
- Supplier listing images support drag/drop, validation, previews, remove, reorder, primary selection and alt text.
- Supporting documents support multiple-file selection, document type, view/remove and existing-file management.
- Listing certification documents remain on the dedicated certification workflow and now support existing-document removal while preserving the separate AviaInventory review/verification state.
- Failed uploads clean up successfully uploaded objects from the current batch before returning an error.
- Create flow creates the listing record before asset upload, then removes the draft record and uploaded objects if asset persistence fails.

## Important behavior

The UI reports upload progress by completed file rather than pretending to know byte-level progress. This is deliberately labeled as such because the standard Supabase browser upload call used here does not expose byte-level progress.

The first image in the final persisted order is the primary marketplace image. A new image can be explicitly made primary before saving; existing images can be made primary during editing.

Certification verification remains separate from supplier/company verification. Suppliers cannot self-mark certification documents as verified.

## Validation note

A full dependency install was attempted but timed out in the execution environment. The global TypeScript parser was then run against the project; after fixing a syntax error, the remaining TypeScript invocation was blocked by missing dependency type-definition packages in the partially installed `node_modules`. No successful production `next build` is claimed.
