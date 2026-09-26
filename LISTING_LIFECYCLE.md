# AviaInventory Listing Lifecycle

## Status model

| Status | Marketplace visible | Meaning | Allowed next states |
|---|---|---|---|
| Draft | No | Supplier is preparing the listing | Published, Archived |
| Published | Yes | Available for buyer discovery | Reserved, Inactive, Archived |
| Reserved | No | Inventory is committed/reserved | Published (release), Sold, Inactive |
| Sold | No | Inventory has been sold | Archived |
| Inactive | No | Temporarily withdrawn from marketplace | Published, Archived |
| Archived | No | Historical/closed record | Terminal |

### Business rules

- Marketplace discovery is restricted to `Published` listings.
- `Reserved`, `Sold`, `Inactive`, and `Archived` listings are not returned by public marketplace queries or public part detail lookups.
- A listing that has RFQs, quotes, purchase orders, shipments, or invoices is considered to have business history.
- Business history prevents permanent deletion and prevents returning the listing to `Draft`.
- Historical listings should be moved to `Inactive` or `Archived` rather than destroyed.
- Permanent deletion is limited to clean `Draft` listings with no business history. The UI labels this as `Delete draft` and requires a purpose-built modal.
- `Sold` and `Archived` records are protected from content editing through the supplier edit route.

## Transaction protection

The lifecycle migration adds transaction-aware database functions and a database trigger. The checks are not UI-only, so direct client updates cannot bypass the transition matrix.

History is detected through:

- RFQs linked directly to the listing.
- Quotes belonging to those RFQs.
- Orders/purchase orders linked to the listing.
- Supplier shipments linked to those orders.
- Supplier invoices linked to those orders.

## Confirmation UX

Generic `window.confirm()` is removed from supplier listing deletion/document removal flows. AviaInventory uses accessible, responsive confirmation dialogs with explicit consequences and a disabled destructive action when business history makes deletion unsafe.

## Migration order

`20260917_zzz_listing_lifecycle.sql` intentionally runs after the supplier operations migration because the transaction-protection function reads `supplier_shipments` and `supplier_invoices`.

## Validation note

The repository's dependency installation is incomplete in the execution environment, so a full production `next build` was not available for verification. TypeScript checking was attempted and was blocked by missing installed React/Next/type dependencies rather than a reported lifecycle-specific compile error.

## QA hardening additions

- New listings are always persisted as `Draft` first; publication then uses the guarded `transition_listing_status` RPC.
- Reserved, Sold and Archived listings are protected from content edits.
- Any listing with RFQ, quote, order, shipment or invoice history is protected from material content edits.
- Direct authenticated DELETE permission on `public.parts` is revoked; clean draft deletion uses the controlled RPC.
- Reviewed certification evidence prevents a draft from qualifying as a permanently disposable “clean draft”.
