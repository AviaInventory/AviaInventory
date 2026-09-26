# AviaInventory Supplier Operations Workspace

This update turns the supplier dashboard into an aviation parts sales and inventory control centre.

## Workflow
Profile -> Verification -> Inventory -> Buyer RFQ -> Quote -> Purchase Order -> Shipment -> Payment

## Dashboard priorities
- Active listings, drafts and listings needing attention
- Incoming buyer RFQs
- Quotations awaiting response and accepted quotations
- Active purchase orders
- Shipment and invoice records
- Unread buyer messages
- Supplier verification status and readiness
- Compliance document expiry alerts
- Action-oriented Next steps instead of placeholder performance statistics

## Data integrity
Dashboard counts are loaded from Supabase. No revenue, shipment, invoice or performance figures are fabricated. Shipment and invoice counts use the new `supplier_shipments` and `supplier_invoices` tables after the migration is applied.

## Security
The new operational tables use supplier-owned RLS. Supplier verification remains controlled by the existing verification workflow; suppliers cannot self-mark as Verified.

## Responsive/accessibility
The workflow rail is horizontally scrollable on narrow screens, action cards wrap at mobile widths, controls use touch-friendly minimum heights, and status is represented with icon + label rather than color alone.
