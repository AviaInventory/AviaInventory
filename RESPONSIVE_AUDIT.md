# AviaInventory — Full Responsive Layout Audit

Audit target: 320–767px mobile, 768–1023px tablet, and 1024px+ desktop.

## Responsive rules applied
- Public navigation remains compact on phones; desktop navigation is enabled at large breakpoints.
- Buyer/supplier workspaces use desktop sidebars at large widths and horizontal/mobile navigation below them.
- Multi-column grids collapse to one column on phones and progressively expand at `sm`, `md`, `lg`, `xl` breakpoints.
- Dense data tables intentionally scroll horizontally inside contained wrappers instead of widening the page.
- Long part numbers, NSNs, emails, URLs and supplier names wrap instead of forcing viewport overflow.
- Search/filter controls use full width on phones and compact multi-column layouts on larger screens.
- Dashboard message panes and charts reduce their minimum height on phones.
- Authentication role cards stack on phones.
- Homepage feature/CTA headers stack on phones while remaining horizontal on desktop.
- Touch targets are kept at approximately 44px on small/tablet screens.
- Reduced-motion preferences are respected globally.

## Routes audited
- `/admin/dashboard`
- `/buyer/dashboard`
- `/buyer/messages`
- `/buyer/orders/:id`
- `/buyer/orders`
- `/buyer/quotations`
- `/buyer/quotes/:id`
- `/buyer/rfqs/:id/comparison`
- `/buyer/rfqs/:id`
- `/buyer/rfqs/new`
- `/buyer/rfqs`
- `/buyer/settings`
- `/login`
- `/marketplace/:id`
- `/marketplace`
- `/`
- `/platform-console/login`
- `/register`
- `/style-guide`
- `/supplier/dashboard`
- `/supplier/inventory/:id/edit`
- `/supplier/inventory/:id`
- `/supplier/inventory/new`
- `/supplier/inventory`
- `/supplier/invoices/:id`
- `/supplier/invoices`
- `/supplier/messages`
- `/supplier/profile`
- `/supplier/purchase-orders/:id`
- `/supplier/purchase-orders`
- `/supplier/quotes`
- `/supplier/rfqs/:id`
- `/supplier/rfqs`
- `/supplier/shipments/:id`
- `/supplier/shipments`
- `/suppliers/:id`

## Known intentional horizontal scrolling
The RFQ comparison and operational data tables contain more columns than a phone can display comfortably. These remain horizontally scrollable within the card, which preserves the desktop information density without causing page-level horizontal overflow.

## Validation note
The source was inspected across all App Router pages/components for fixed-width grids, tables, mobile breakpoints, overflow handling, and dashboard shells. A full Next.js production build could not be completed in this environment because dependency installation timed out; no build-success claim is made.
