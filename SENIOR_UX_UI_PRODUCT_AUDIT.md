# AviaInventory — Senior UX, UI, Accessibility & Product Audit
## Supplier Operations Workspace Complete Source Package

**Audit scope:** public website, marketplace, search, part details, supplier discovery/profile, registration, buyer/supplier/hybrid onboarding, buyer/supplier dashboards, RFQs, quotations, purchase orders, inventory/listing create/edit, messages, account management/settings, verification/documents and authentication.

**Audit date:** 17 September 2026

## Executive assessment

The package has a credible aviation-specific visual foundation and a much stronger supplier operating model than a generic SaaS dashboard. The supplier workspace now expresses the intended commercial lifecycle and puts verification, inventory, RFQs, quotes, orders, shipments, invoices and messages into one operating context.

The highest-risk findings are **data/workflow integrity and information security**, not visual polish. In particular:

- The listing UI previously mixed `Active` and `Published` states while dashboard/marketplace logic used `Published`. This could make newly created inventory disappear from supplier active counts and the public marketplace.
- Client-side quotation status updates were broader than the business rule implied by the workflow; database enforcement is required because UI restrictions alone are not security controls.
- RFQ attachments and part documents use public URLs in client-side services. This is appropriate only if the product explicitly intends those files to be publicly reachable. Procurement attachments and supplier evidence should normally be private and access-controlled.
- Several important workflows still rely on browser `alert()` / `confirm()`, which is disruptive, inaccessible in context, and inconsistent with the rest of the product.
- Error handling frequently collapses to an empty state, making "no records" indistinguishable from "the data failed to load".
- Hybrid role switching is implemented, but role context should be made persistent and explicit at workspace level rather than relying on separate routes alone.

## Priority scale

- **P0 — Critical:** security, authorization, data integrity, or transaction correctness.
- **P1 — High:** blocks or materially harms core procurement/sales workflows.
- **P2 — Medium:** meaningful usability, accessibility, consistency or efficiency issue.
- **P3 — Low:** refinement, visual polish or future optimization.

---

## Findings by flow

| Area | Current problem | Why it matters | Recommended solution | Priority | Affected files/components | Type |
|---|---|---|---|---|---|---|
| Public website | Public navigation exposes buyer-oriented `RFQs` while supplier users also use the global header; the meaning of the tab is ambiguous. | A supplier may interpret it as their own RFQ workspace and be taken into a buyer route. | Make the global nav audience-neutral (`Marketplace`, `Suppliers`, `How it works`) and put authenticated workspaces in the Account/workspace shell. | P2 | `components/layout/Navbar.tsx`, `components/layout/SiteChrome.tsx` | UX / product |
| Public website | Header uses a blue SaaS-like treatment while the rest of the design token system is aviation-industrial. | Visual language can feel split between marketing and operational surfaces. | Consolidate header colors, focus states and buttons onto aviation design tokens; retain the adopted AviaInventory mark. | P2 | `Navbar.tsx`, `app/design-tokens.css`, `app/globals.css` | UI |
| Marketplace | Marketplace/public server queries select `*`. | Unnecessary data exposure and brittle contracts can leak fields as the schema grows. | Replace `select("*")` with an explicit public field allow-list. | P1 | `lib/marketplace-server.ts`, `lib/parts.ts` | Security / data architecture |
| Marketplace | Certification/traceability is presented as a single label on listings. | Buyers may need to distinguish availability of a document from its verification/acceptance state. | Separate `document available`, `document type`, and `verification status`; use buyer-facing trust badges with a tooltip/explanation. | P1 | `components/trust/TrustBadge.tsx`, marketplace cards/details | Product / UX |
| Search | Autocomplete is limited to client/API suggestions and does not visibly communicate search scope. | Aviation buyers search by PN, alternate PN, NSN, OEM/manufacturer and description; ambiguity causes poor discovery. | Label scope in the field and show suggestion type (`Part number`, `NSN`, `Manufacturer`, `Description`). | P1 | `components/search/PartSearchAutocomplete.tsx`, `app/api/marketplace/suggestions/route.ts` | UX |
| Search | Search query construction uses user input inside `ilike`/`or` expressions. | Special characters can produce malformed filters or unexpected matching. | Centralise escaped PostgREST search construction and validate query length/characters server-side. | P1 | `lib/marketplace-server.ts`, suggestion route | Security / functionality |
| Part details | Public part details select broad records and can expose fields that are not required by buyers. | Aviation parts can contain operational or traceability-sensitive information. | Define a public part DTO; expose only buyer-safe commercial and trust fields. | P1 | `lib/parts.ts`, `lib/marketplace-server.ts`, `components/marketplace/PartDetails.tsx` | Security / data architecture |
| Supplier discovery | Supplier summary exposes verification status but public profile trust explanation is not always contextual. | Buyers need to understand what "Verified" means and what it does not mean. | Add a consistent trust panel: verification status, reviewed scope, certification indicators, last-reviewed date where appropriate. | P1 | `components/trust/TrustBadge.tsx`, supplier pages | UX / trust |
| Supplier profile | Supplier profile editing and Account Centre overlap. | Two competing places for company information create duplicate mental models and possible data drift. | Make Account Centre the canonical editor; supplier profile becomes the public/read-only representation plus a single "Edit company account" route. | P1 | `app/supplier/profile/page.tsx`, `components/account-center/AccountSection.tsx` | UX / data architecture |
| Registration | Registration stores a large amount of onboarding metadata directly in `profiles.onboarding_data`. | JSON is flexible but makes validation, analytics and downstream preference matching harder. | Keep onboarding draft JSON temporarily, then promote stable fields to typed tables/columns as onboarding completes. | P1 | `components/auth/RegistrationWizard.tsx`, `lib/auth.ts`, onboarding migration | Data architecture |
| Registration | Password/auth errors and profile errors are handled in separate stages after signup. | Partial account creation can leave users unsure whether they are registered and what to do next. | Use a transaction-like server workflow or explicit account-state recovery page after auth creation. | P1 | `lib/auth.ts`, `components/auth/RegisterForm.tsx` | Functionality / UX |
| Buyer onboarding | Buyer profile completion and preference completion are separate concepts but can look like one percentage. | Buyers may believe they are "complete" while important procurement preferences remain unset. | Display separate completion tracks: Identity, Company, Buying profile, Security. | P2 | onboarding components, Account Centre | UX |
| Supplier onboarding | Supplier verification is correctly separate from profile completion, but this distinction should be explicit everywhere. | Verification is an authorization/trust decision, not merely a form-completion score. | Always show three states: profile completeness, document readiness, verification decision. | P1 | `VerificationOverview.tsx`, dashboard trust panel, onboarding | Product / trust |
| Hybrid accounts | Hybrid role support uses `account_roles`, but route/workspace context is largely URL-driven. | Users can lose context about whether an action is being performed as buyer or supplier. | Persist a workspace preference and show a strong `Buying / Selling` switcher in authenticated chrome. | P1 | `RoleSwitcher.tsx`, buyer/supplier layouts, Account Centre | UX / functionality |
| Hybrid accounts | Company data is still duplicated into `buyers` and `suppliers` while `profiles` acts as the master record. | Drift can occur when company details change in one role-specific table. | Introduce a true `companies` entity and role memberships; migrate legacy buyer/supplier records to it. | P0 | hybrid migration, `profiles`, `buyers`, `suppliers` | Data architecture |
| Buyer dashboard | Dashboard cards are still more metric-centric than task-centric in places. | Procurement users care about exceptions, RFQs awaiting action, quote expiry and orders requiring follow-up. | Prioritise task queues and deadlines; keep metrics secondary. | P2 | buyer dashboard components | UX |
| Supplier dashboard | The new Next Steps model is materially better, but duplicate attention can occur when a draft also lacks fields. | Users can see multiple actions referring to the same underlying listing. | Keep Drafts and Published listings-needing-attention as separate queues. The source was updated accordingly. | P1 | `SupplierOperationsDashboard.tsx` | UX / functionality |
| Supplier dashboard | Dashboard initially treated only `Published` as active while creation/edit UI allowed `Active`. | This caused lifecycle inconsistency and could make inventory appear missing. | Canonicalise lifecycle to `Published / Draft / Reserved / Sold / Inactive`; migration normalises legacy `Active` values. | P0 | `AddPartForm.tsx`, `EditPartForm.tsx`, `StatusSection.tsx`, operations migration | Data integrity |
| Supplier dashboard | Dashboard refresh errors previously degraded to empty data. | "No RFQs" and "RFQ service failed" are materially different states. | Preserve error state, explain stale/incomplete data and offer Retry. Implemented in the supplier dashboard. | P1 | `SupplierOperationsDashboard.tsx` | UX / functionality |
| Inventory | Inventory deletion uses browser confirm and alert. | Poor accessibility, abrupt context switch and no recovery/undo. | Replace with an in-app destructive confirmation dialog and provide soft-delete/archive where possible. | P2 | `InventoryTable.tsx` | UX / accessibility |
| Inventory | Table is usable with horizontal scrolling but mobile users still get a dense desktop representation. | Horizontal scanning of seven columns is costly on 375px. | Add a mobile card/list representation with key fields and an overflow action menu; retain table at tablet/desktop. | P1 | `InventoryTable.tsx` | UX / mobile |
| Listing creation | `Manufacturer` was visually optional while validation required it. | Users receive a validation surprise and field hierarchy is inconsistent. | Mark required fields consistently and use inline field errors. Implemented for Manufacturer. | P1 | `GeneralInformation.tsx`, `AddPartForm.tsx` | UX / accessibility |
| Listing creation | Create form defaults to publish immediately. | In aviation procurement, incomplete documentation should not accidentally become buyer-visible. | Default new records to Draft; show a pre-publish readiness checklist. Implemented. | P0 | `app/supplier/inventory/new/page.tsx`, `AddPartForm.tsx` | Product / data integrity |
| Listing creation | Certification documents are uploaded as a generic file list, with no explicit document type/version/expiry structure. | Buyers and compliance reviewers cannot reliably understand the evidence set. | Store listing evidence in a typed document relation: type, issue/expiry, issuer, verification state, version and access scope. | P0 | certification section, parts schema | Data architecture / trust |
| Listing creation | `getPublicUrl()` is used for part documents. | If the bucket is public, any URL holder can retrieve documents; this is risky for traceability/maintenance evidence. | Separate public listing media from protected certification evidence. Use private storage + signed URLs and participant authorization. | P0 | `lib/parts.ts`, storage migration, marketplace detail | Security |
| Listing editing | Edit form resets missing status to `Published` while older records may contain `Active`; now corrected. | Prevents accidental lifecycle changes and hidden records. | Use a single status enum shared by DB/types/UI. | P0 | `EditPartForm.tsx`, types, migration | Data architecture |
| Listing editing | Existing images/documents are appended but there is no explicit replace/remove UI in the general listing editor. | Inventory records accumulate stale evidence/media and suppliers cannot correct errors cleanly. | Add document/image inventory with remove, replace, version and audit metadata. | P1 | `AddPartForm.tsx`, upload sections | Functionality |
| RFQs | RFQ list has good filtering/table structure but error states can resemble empty results. | Supplier may miss a live buyer request because of a transient service error. | Add explicit error state + retry and distinguish zero results from failed load. | P1 | `RFQTable.tsx`, RFQ page | UX / functionality |
| RFQs | RFQ attachment upload uses public URLs. | Buyer-provided documents may contain aircraft/customer/maintenance information. | Make RFQ attachments private and issue signed URLs only to RFQ participants. | P0 | `lib/rfqs.ts`, `AttachmentUpload.tsx`, RFQ details, storage policies | Security |
| RFQs | RFQ status updates are spread across client functions. | Business rules can be bypassed by direct API calls if RLS/RPC does not enforce state transitions. | Enforce RFQ state machine in database/RPCs, not only UI. | P0 | `lib/rfqs.ts`, RFQ migrations | Security / functionality |
| Quotes | `createQuote()` correctly derives supplier and buyer identity from authenticated RFQ rather than trusting client supplier ID. | This is good security practice. | Keep this pattern and extend it to all commercial mutations. | P1 | `lib/rfqs.ts` | Security |
| Quotes | Generic `updateQuoteStatus()` can update through an OR of buyer/supplier ownership. | Client-side callers could attempt role-inappropriate status transitions. | Enforce role-aware status transitions in DB. A hardening migration was added to block supplier self-acceptance and protect quote identity fields. | P0 | `lib/rfqs.ts`, hardening migration | Security |
| Quotes | Quote submission uses `alert()` for validation/success/error. | Context is lost and screen-reader users receive inconsistent feedback. | Use inline errors plus toast/live-region confirmation. | P2 | `QuoteForm.tsx` | UX / accessibility |
| Quotes | Quote validity/expiry is not consistently surfaced as a countdown across supplier screens. | Time-sensitive commercial offers can become stale. | Show absolute expiry date plus relative countdown and disable expired actions. | P1 | quote tables/details | UX / functionality |
| Purchase orders | Supplier can update several order statuses directly from the client. | Status transitions can be skipped unless DB rules enforce sequence. | Implement a server/RPC state machine: Pending → Processing → Packed → Shipped → Delivered → Completed, with permitted cancellation paths. | P0 | `lib/orders.ts`, order migration | Security / functionality |
| Shipments | Shipment records exist, but shipment creation/tracking lifecycle is comparatively thin. | Fulfillment is a core B2B workflow, not just a count on the dashboard. | Add shipment creation from PO, carrier/tracking, package/line-item linkage, shipped/delivered timestamps and exception states. | P1 | shipment pages/components, migration | Product |
| Invoices | Invoice records are present but are not connected to a payment provider/accounting workflow. | "Payment" in the workflow can be mistaken for an actual payment system. | Clearly label current state as invoice/payment tracking unless a payment provider is integrated; add payment terms, remittance reference and reconciliation status. | P1 | invoice pages/migration | Product / data |
| Messages | Supplier message page first loads all messages where user is sender/recipient, then filters through RFQs. | This increases data retrieval and makes security dependent on multiple downstream filters. | Query only RFQs accessible to the supplier, then fetch messages for those RFQ IDs; enforce participant RLS. | P1 | `app/supplier/messages/page.tsx`, message RLS | Security / data architecture |
| Messages | Conversations are grouped by RFQ, but there is no clear unread/action priority model beyond counts. | High-priority buyer clarifications can be buried. | Add unread, last-message time, RFQ status, quote state and response SLA to conversation rows. | P2 | supplier/buyer message components | UX |
| Account management | Account Centre and supplier profile overlap. | Duplication increases support burden and data drift. | Canonicalise Account Centre as editor; supplier profile as public presentation. | P1 | account/supplier profile | UX / data |
| Account management | Team/company membership model uses owner user ID as `company_id` rather than a true company entity. | It does not fully represent multiple users belonging to one legal company independently of the owner. | Introduce `companies`, `company_members`, roles, invitations and ownership transfer. | P0 | account migration, Account Centre | Data architecture / security |
| Settings | Notification preferences exist but are not obviously connected to actual event delivery. | Users may believe alerts are configured when no provider/event pipeline is wired. | Define event taxonomy and notification delivery service; show channel availability explicitly. | P1 | Account Centre, notification tables | Functionality |
| Verification | Supplier can submit verification but document replacement/update semantics need stronger audit trail. | Aviation trust workflows require evidence history. | Immutable document versions + reviewer identity + review timestamp + decision reason; supplier cannot edit reviewer fields. | P0 | verification migration/components | Security / compliance |
| Verification | Verification status is highly visible, which is good, but profile completion and document health can still be visually conflated. | A 100% profile does not equal verified supplier status. | Use three separate status cards and plain-language explanations. | P1 | verification/dashboard | UX / trust |
| Documents | Verification documents are correctly stored in a private bucket, but the broader listing/RFQ document model is inconsistent. | Two different document security models can confuse developers and reviewers. | Create a unified document classification/access model: Public Media, Buyer-visible Evidence, Private Compliance, Internal Review. | P0 | storage migrations, document components | Data architecture / security |
| Authentication | Auth/profile creation is split into several client-side operations. | Partial failure can leave auth user without a complete profile or role records. | Use server-side onboarding completion endpoint/RPC with idempotent steps and recovery. | P0 | `lib/auth.ts`, registration wizard, auth routes | Security / functionality |
| Authentication | Login errors previously surfaced low-context raw error output during debugging. | End users need actionable, non-sensitive error messages. | Map auth errors to safe UX messages; log technical detail server-side only. | P1 | `LoginForm.tsx`, `lib/auth.ts` | UX / security |
| Authentication | No strong visible session/device management despite Account Centre security section. | B2B company accounts need practical account takeover controls. | Add recent sessions, revoke individual session, sign out all other sessions, MFA status and security-event history. | P1 | Account Centre security | Security |
| Accessibility | Many forms use labels without `htmlFor`/input IDs and rely on visual proximity. | Assistive technology users may not get reliable field names. | Give every control a unique ID and explicit label association. | P1 | supplier/buyer/auth/account forms | Accessibility |
| Accessibility | Browser `alert()` / `confirm()` is widely used. | Poorly contextualized feedback and inconsistent focus behavior. | Replace with accessible dialog/toast/live-region primitives. | P1 | RFQ, quote, order, inventory, auth components | Accessibility / UX |
| Accessibility | Status is often color + text, but some table status implementations are plain styled spans. | Color contrast and non-color identification must remain consistent. | Standardize status badge component with icon + text + accessible label and consistent focus/tooltip behavior. | P2 | `StatusBadge.tsx`, RFQ/quote badges | Accessibility / UI |
| Accessibility | Some icon-only buttons have labels, but this should be systematically audited. | Missing accessible names make keyboard/screen-reader navigation ambiguous. | Run automated axe/Lighthouse plus keyboard audit; require accessible names for all icon-only controls. | P1 | all interactive components | Accessibility |
| Mobile | Supplier mobile nav is horizontally scrollable and comprehensive, but it can consume substantial vertical space below the global header. | 375px users lose valuable working area and repeated nav can feel like double chrome. | Keep 4–5 highest-frequency items in bottom/compact workspace nav and expose secondary operations via drawer. | P2 | `MobileNav.tsx`, supplier layout | UX / mobile |
| Mobile | Dense supplier inventory/RFQ tables remain desktop-first at small widths. | Horizontal scrolling is functional but not efficient for operational work. | Use responsive list/card views for 375px, with horizontal table retained from 768px upward where appropriate. | P1 | inventory/RFQ/quote/order tables | UX / mobile |
| Loading | Some flows have skeletons, others display plain "Loading..." panels. | Inconsistent loading language makes product feel unfinished. | Standardize skeleton patterns by surface: list, table, detail, form, dashboard. | P2 | supplier/buyer detail components | UI / UX |
| Error handling | Many data functions return `[]` or `null` after logging errors. | This collapses failure into an empty state and hides outages from users. | Return typed `{data,error}` service results or throw to route-level error boundaries. | P1 | `lib/parts.ts`, `lib/orders.ts`, `lib/rfqs.ts`, pages | Functionality |
| Empty states | Several empty states are generic "No records" experiences. | B2B users benefit from guidance based on workflow stage. | Every empty state should answer: what happened, why it matters, next action. | P2 | dashboard/empty-state components | UX |
| Navigation | Supplier sidebar has operations plus account links, while global nav, mobile nav and Account Centre can duplicate destinations. | Navigation hierarchy can become difficult to learn. | Define three layers: Global marketplace, Workspace operations, Account/company administration. Do not duplicate links unnecessarily. | P1 | Navbar, supplier sidebar/mobile nav, Account Centre | UX |
| Aviation credibility | Several operational screens still use generic card/shadow treatment and broad labels such as "inventory record". | Professional aviation users expect part-level precision, traceability and procurement language. | Use aviation vocabulary consistently: Part Number, Alternate PN, Condition, Trace, Certification, ATA, TSN/CSN/TSO, lead time, stock location, documentation. | P2 | supplier forms/tables/details | UI / product |
| Generic SaaS patterns | Dashboard metrics can resemble generic SaaS analytics when separated from workflow. | It weakens the procurement-control-centre positioning. | Keep metrics subordinate to exceptions, buyer demand, quote deadlines and fulfillment queues. | P2 | buyer/supplier dashboards | UX |

---

# Implemented in this audit pass

### 1. Listing lifecycle hardening
- New supplier inventory starts as **Draft** instead of immediately publishing.
- Listing status UI now uses `Published` instead of the conflicting `Active` value.
- Edit fallback status now uses `Published`.
- Legacy `Active` rows are normalised to `Published` by migration.
- Supplier dashboard "Listings needing attention" excludes drafts so one record does not create two competing tasks.

### 2. Supplier dashboard reliability
- Added a visible refresh-error state with Retry.
- Prevented the all-clear state from appearing while unresolved published listings still require attention.
- Verification task is only shown when supplier verification data exists and is not already verified.

### 3. Form UX
- Supplier listing creation/editing now uses in-app toast feedback instead of browser alerts for its primary validation/success/error path.
- Manufacturer is visibly required to match validation.
- Inventory search has an accessible label.
- RFQ attachment upload uses contextual toast errors.
- Quote form uses contextual toast validation and success/error feedback.
- Listing forms add unsaved-change protection while editing.

### 4. Quotation security hardening
A new migration adds database-level protection for quote updates:
- supplier cannot self-accept a quote;
- buyer cannot assign supplier-side Draft/Sent states;
- Accepted can only be set by the buyer;
- RFQ/supplier/buyer identity fields cannot be changed during quote update.

### 5. Accessibility/mobile semantics
- Supplier and workspace mobile navigation now has explicit navigation labels.
- Decorative icons in navigation are hidden from assistive technology.
- RFQ attachment upload now exposes help text programmatically.

---

# Recommended next engineering phase

## P0 — before production
1. Private document architecture for RFQ and listing evidence.
2. True `companies` + membership architecture for hybrid/company accounts.
3. Database-enforced RFQ and PO state machines.
4. Server-side/idempotent registration + onboarding completion workflow.
5. Typed public DTOs instead of `select("*")`.
6. Full session/MFA/security-event management.
7. Immutable compliance document version/audit model.

## P1 — immediately after P0
1. Responsive mobile card/list variants for inventory/RFQ/quote/order tables.
2. Replace remaining browser alerts/confirms with accessible dialogs/live regions.
3. Explicit error-vs-empty states across every major data surface.
4. Quote expiry countdowns and commercial deadlines.
5. Message prioritization and response indicators.
6. Canonical Account Centre/company profile architecture.

## P2/P3 — continuous improvement
1. Visual token consolidation across global header and authenticated workspaces.
2. Advanced supplier performance analytics based on real transactional data.
3. Notification delivery/event infrastructure.
4. More aviation-specific microcopy and part-data affordances.
5. Automated accessibility regression testing.

---

# Audit acceptance checklist

- [x] Public navigation reviewed
- [x] Marketplace reviewed
- [x] Search reviewed
- [x] Part details reviewed
- [x] Supplier discovery/profile reviewed
- [x] Registration reviewed
- [x] Buyer onboarding reviewed
- [x] Supplier onboarding reviewed
- [x] Hybrid account architecture reviewed
- [x] Buyer dashboard reviewed
- [x] Supplier dashboard reviewed
- [x] RFQ workflow reviewed
- [x] Quotation workflow reviewed
- [x] Purchase-order workflow reviewed
- [x] Inventory/listing create/edit reviewed
- [x] Shipment workflow reviewed
- [x] Invoice/payment tracking reviewed
- [x] Messaging reviewed
- [x] Account management/settings reviewed
- [x] Verification/compliance reviewed
- [x] Authentication reviewed
- [x] Mobile/accessibility reviewed
- [x] Security/RLS/data-architecture risks reviewed
- [x] Practical source fixes applied

**Validation note:** The source package's dependency tree is not installed in this execution environment. A full production `next build`, type-check and browser/axe run therefore could not be truthfully claimed. The package should be run through CI with `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and an automated accessibility/browser matrix at 375px, 768px and desktop before release.
