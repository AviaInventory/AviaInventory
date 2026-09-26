# AviaInventory — Review & Publish Stage

The supplier listing wizard now ends with a dedicated Review & Publish stage.

## Buyer-facing preview
The final stage renders an approximate marketplace view containing the primary image, part number, manufacturer, description, condition, quantity, price/currency, certification state, document availability, aircraft/engine compatibility, ATA chapter, supplier identity and verification status, rating/review count where available, location and lead time.

## Trust-state separation
The preview explicitly separates:
- Supplier-provided information — entered by the supplier and not independently verified.
- Uploaded documentation — files submitted with the listing.
- AviaInventory-verified information — only certification documents with an explicit AviaInventory Verified outcome receive certification trust badges.

Supplier verification remains separate from listing-document verification.

## Publication controls
The final stage provides:
- Save Draft
- Back to Edit
- Publish Listing

Clicking Publish Listing opens an explicit confirmation dialog. Publication is blocked until the supplier checks the confirmation statement and selects Confirm & Publish Listing.

## Existing listing compatibility
Edit-mode listings retain their stored primary image URL for the buyer preview and load existing listing-level certification documents into the review state. Newly selected files are included in the preview as pending uploads until the listing is saved/published.
