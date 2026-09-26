# AviaInventory fixes included in this package

## Applied changes

- Exported `getPublicSupabase()` from `lib/marketplace-server.ts`.
- Improved Supabase error logging so `message`, `details`, `hint`, and `code` are visible instead of `{}`.
- Removed the About item from the main and mobile navigation.
- Removed the `WhyChooseUs` / About-style section from the homepage.
- Kept the existing authentication, buyer/supplier hybrid account, subscription, marketplace, RFQ, and certification code intact.

## Supabase note

The project contains migrations for the newer profile/account and supplier-verification fields used by the application, including `account_roles`, onboarding fields, and supplier verification fields. If the live Supabase database does not yet have those migrations applied, registration and other features can still return database errors. Apply the SQL files under `supabase/migrations` to the same Supabase project referenced by `.env.local`.

The supplied tables document appears to represent an earlier/partial schema view; the migrations in this package are the source of the newer fields required by the current application features.
