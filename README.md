This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 2026-09-15 visual theme update
- Global sticky AviaInventory navigation is mounted in the root layout for normal public, buyer and supplier routes.
- Header navigation follows the supplied visual reference: Home, Marketplace, Suppliers, RFQs and About, plus Search, Login and Get Started.
- The supplied reference logo is adopted as the header wordmark.
- The homepage's former schematic illustration is replaced by the supplied reference's aircraft hero visual.
- Aviation palette updated to a clean navy/white/blue theme with amber accents.
- Added public `/suppliers` and `/rfqs` landing routes so the global navigation always has valid destinations.

Audit deliverable: see SENIOR_UX_UI_PRODUCT_AUDIT.md

## Listing lifecycle

Supplier listings now use the protected lifecycle `Draft -> Published -> Reserved -> Sold -> Archived`, with `Inactive` as the withdrawal state. Public marketplace visibility is limited to `Published`. Transaction-linked listings cannot be hard-deleted or returned to Draft. See `LISTING_LIFECYCLE.md`.


## Account model

AviaInventory now exposes two public account choices: **Buyer** and **Buyer & Supplier**. Buyer accounts can upgrade to enable the existing Supplier workspace without creating a second company account. Legacy Supplier-only profiles are migrated to Buyer & Supplier by `20260923_simplify_public_account_types.sql`.

## Subscription & Billing

See `SUBSCRIPTION_BILLING_IMPLEMENTATION.md` for the implemented plan catalogue, Stripe configuration, Supabase migration and QA/deployment notes.
