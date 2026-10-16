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
- `lib/billing/paystack.ts` — Paystack API: checkout (cards and M-Pesa), on-demand Paystack plans for card renewals, transaction verification, card-management links and webhook signatures.
- `lib/billing/pricing.ts` — the KES amount charged for a plan (interim fixed USD→KES rate).
- `lib/billing/apply-payment.ts` — applies a verified charge to the subscription, idempotently (shared by the return page and the webhook).
- `supabase/migrations/20261017000100_paystack_billing.sql` — Paystack plan cache, subscription token store, payment method columns.
- `supabase/migrations/20260923000200_subscriptions_billing_paid_plans.sql` — subscription, billing, premium visibility and marketing schema/RLS.

## Required environment variables

Copy `.env.example` to the deployment environment and configure:

- `NEXT_PUBLIC_APP_URL`
- `PAYSTACK_SECRET_KEY` (server only)
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- `BILLING_USD_KES_RATE` (interim conversion rate, e.g. 130)
- `BILLING_GRACE_PERIOD_DAYS` (default 7)
- `FEATURED_LISTING_LIMIT` (default 5)

Existing Supabase variables remain required.

## Payment setup (Paystack)

The Kenyan Paystack account charges in KES (USD is not enabled yet). Plans stay priced in USD and are charged at `USD × BILLING_USD_KES_RATE`, rounded up to KES 50, until the long-term conversion policy is decided.

- **Card:** a Paystack subscription renews automatically. Paystack plans are created on first use per plan/interval/amount and cached in `paystack_plans`.
- **M-Pesa** (`mobile_money` channel): pays for one period; the customer renews from the subscription page.
- After payment Paystack redirects to `/account/subscription?reference=…`; the page confirms it through `/api/billing/verify`, so plans activate even without a webhook (useful locally).
- Webhook: in Paystack set **Settings → API Keys & Webhooks → Webhook URL** to `https://www.aviainventory.com/api/billing/webhook`. Signatures (`x-paystack-signature`, HMAC-SHA512) are verified; handled events: `charge.success` (incl. card renewals), `subscription.create`, `subscription.not_renew`, `subscription.disable`, `invoice.payment_failed`.
- Settlement bank accounts (NCBA KES; NCBA USD once USD is enabled) are configured in the Paystack dashboard, not in code.

Test mode: Paystack test card `4084 0840 8408 4081`, any future expiry, CVV `408`, PIN `0000`, OTP `123456`.

## Subscription behaviour

- New Buyer and Hybrid profiles receive a 90-day trial through a database trigger.
- Trial expiry does not charge the customer automatically.
- Expired users retain login, Account Centre, billing and data access but are redirected from paid product workspaces to subscription selection.
- Buyer accounts can only select Buyer Basic after trial.
- Hybrid accounts can select Hybrid Basic, Bronze or Platinum.
- Bronze/Platinum cannot be selected by Buyer-only accounts.
- Buyer → Hybrid account conversion remains separate from subscription upgrades.
- Existing business data is never deleted because of subscription state.
- Changing plan starts a new Paystack payment; once it succeeds, the previous card subscription is disabled so only one plan renews.

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
2. Set the Paystack keys and `BILLING_USD_KES_RATE` in the environment.
3. Set the Paystack webhook URL to `/api/billing/webhook` on the production domain.
4. Install the project's normal dependencies with `npm install`/`npm ci` in the deployment environment.
5. Run `npm run lint` and `npm run build` in the deployment environment.
6. Test registration, trial countdown/expiry, checkout, webhook activation, monthly/annual changes, cancellation/past-due handling, Buyer → Hybrid conversion, and supplier premium entitlements.
