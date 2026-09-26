# AviaInventory Account Management Centre

Implemented a unified B2B company account centre at `/account/profile` with a persistent site navigation bar and responsive account sidebar/drawer.

## Sections

- Personal Profile
- Company Profile
- Users / Team
- Buying Preferences
- Selling Preferences
- Supplier Verification
- Compliance & Documents
- Security
- Notifications
- Preferences
- Billing / Financial
- Privacy & Controls

## Data model

`profiles` remains the master company/person record. The migration adds reusable company fields and an `account_preferences` table for role-specific preferences, notifications, privacy, and display defaults. `company_members` and `company_invitations` support company team management without duplicating the master company profile.

## Security

- Account pages require an authenticated buyer, supplier, or admin role.
- Account preferences are protected by user-scoped RLS.
- Company owner controls team invitations and membership records.
- Invitees can only view invitations addressed to their authenticated email and accept through the secure RPC.
- Supplier verification and private compliance document controls remain in the existing supplier verification migration.
- Private supplier documents are not surfaced by Account Centre public pages.

## Supabase migration

Apply `supabase/migrations/20260917_account_management_center.sql` after the existing AviaInventory migrations.

## Important integration note

The team invitation UI records invitations in Supabase. Email delivery is intentionally not hard-coded to a third-party provider; connect the project's preferred transactional email service to send invitation messages.

Security-sensitive account deletion/deactivation should be routed through a controlled platform workflow rather than deleting authentication records from a browser client.

## Existing functionality preserved

The update retains the existing homepage, marketplace, supplier/buyer workspaces, RFQs, orders, authentication, supplier verification, private document storage, hybrid account architecture, and persistent top navigation.
