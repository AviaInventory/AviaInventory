# AviaInventory Subscription & Billing Implementation

Implemented against the existing two-account AviaInventory model: **Buyer** and **Buyer & Supplier Hybrid**.

## Plans

| Account | Plan | Monthly | Annual |
|---|---|---:|---:|
| Buyer | Free Trial | USD 0 | USD 0 / 90 days |
| Buyer | Basic | USD 12 | USD 100 |
| Hybrid | Free Trial | USD 0 | USD 0 / 90 days |
| Hybrid | Basic | USD 25 | USD 200 |
| Hybrid | Bronze | USD 48 | USD 550 |
| Hybrid | Platinum | USD 95 | USD 1,000 |

## Architecture

- `lib/billing/plans.ts` — central application plan/entitlement catalogue.
- `lib/billing/entitlements.ts` — effective subscription state and entitlement evaluation.
- `lib/billing/subscription.ts` — server-side subscription retrieval and route protection.
- `lib/billing/stripe.ts` — provider abstraction currently implemented with Stripe Checkout, Billing Portal, subscription plan changes and signed webhooks.
- `supabase/migrations/20260923_subscriptions_billing_paid_plans.sql` — subscription, billing, premium visibility and marketing schema/RLS.

## Required environment variables

Copy `.env.example` to the deployment environment and configure:

- `NEXT_PUBLIC_APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_BUYER_BASIC_MONTHLY`
- `STRIPE_PRICE_BUYER_BASIC_ANNUAL`
- `STRIPE_PRICE_HYBRID_BASIC_MONTHLY`
- `STRIPE_PRICE_HYBRID_BASIC_ANNUAL`
- `STRIPE_PRICE_HYBRID_BRONZE_MONTHLY`
- `STRIPE_PRICE_HYBRID_BRONZE_ANNUAL`
- `STRIPE_PRICE_HYBRID_PLATINUM_MONTHLY`
- `STRIPE_PRICE_HYBRID_PLATINUM_ANNUAL`
- `BILLING_GRACE_PERIOD_DAYS` (default 7)
- `FEATURED_LISTING_LIMIT` (default 5)

Existing Supabase variables remain required.

## Payment setup

Create six recurring Stripe Prices matching the amounts above and place their Price IDs in the corresponding environment variables. Configure a Stripe webhook for:

`/api/billing/webhook`

The webhook must include subscription and invoice lifecycle events used by the application. Stripe signatures are verified before processing, and event IDs are stored for idempotency.

## Subscription behaviour

- New Buyer and Hybrid profiles receive a 90-day trial through a database trigger.
- Trial expiry does not charge the customer automatically.
- Expired users retain login, Account Centre, billing and data access but are redirected from paid product workspaces to subscription selection.
- Buyer accounts can only select Buyer Basic after trial.
- Hybrid accounts can select Hybrid Basic, Bronze or Platinum.
- Bronze/Platinum cannot be selected by Buyer-only accounts.
- Buyer → Hybrid account conversion remains separate from subscription upgrades.
- Existing business data is never deleted because of subscription state.
- Paid plan changes use the existing Stripe subscription when one exists, avoiding duplicate paid subscriptions.

## Premium supplier services

Bronze:
- Featured listings
- Promotions
- Bounded priority-search boost

Platinum:
- Everything in Bronze
- Aviation Market Intelligence architecture
- Newsletter promotion requests
- WhatsApp promotion requests
- External advertising campaign requests

Premium services are subject to AviaInventory review. No fabricated intelligence, campaign delivery or performance metrics are generated.

## Pages/routes

- `/pricing`
- `/account/subscription`
- `/api/billing/checkout`
- `/api/billing/portal`
- `/api/billing/webhook`
- `/supplier/marketing`
- `/supplier/marketing/featured`
- `/supplier/marketing/promotions`
- `/supplier/marketing/intelligence`
- `/supplier/marketing/campaigns`
- `/admin/dashboard/subscriptions`

## QA performed in this environment

- Static TypeScript/TSX syntax transpilation: **31 modified files checked, 0 syntax errors**.
- Full `tsc` / ESLint / Next production build could not be completed because the uploaded package's dependency installation is incomplete in the execution environment. `npm install` timed out and offline installation reported a missing cached package (`zod-validation-error`).
- The existing project already contains TypeScript errors when dependencies/types are unavailable, so those environment errors are not treated as subscription-code failures.

## Deployment order

1. Apply the Supabase migration.
2. Configure Stripe Products/Prices and environment variables.
3. Configure the Stripe webhook endpoint and signing secret.
4. Install the project's normal dependencies with `npm install`/`npm ci` in the deployment environment.
5. Run `npm run lint` and `npm run build` in the deployment environment.
6. Test registration, trial countdown/expiry, checkout, webhook activation, monthly/annual changes, cancellation/past-due handling, Buyer → Hybrid conversion, and supplier premium entitlements.
