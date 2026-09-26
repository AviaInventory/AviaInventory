# AviaInventory Progressive Onboarding Redesign

Implemented in the uploaded source package:

- Buyer, Supplier and Buyer + Supplier account modes.
- Progressive onboarding with role-specific steps.
- Required account-creation fields separated from optional aviation profile information.
- Buyer procurement profile: categories, procurement role, sourcing priorities, certification requirements and supplier criteria.
- Supplier profile: supplier type, categories, aircraft/platform specialties, capabilities, certifications, traceability, geographic coverage, logistics and commercial notes.
- Supplier compliance preparation without making verification documents mandatory at registration.
- Automatic browser draft persistence that intentionally excludes passwords.
- Save & continue later action.
- Step progress indicator and profile-completion calculation.
- React Hook Form + Zod validation.
- Accessible labels, focus states, aria attributes and 44px minimum interactive controls.
- Mobile/tablet/desktop responsive layouts.
- Existing authentication, marketplace, RFQ and dashboard routes are preserved.
- New Supabase migration stores onboarding status, completion percentage and structured onboarding data on the existing profile.

## Database migration

Apply:

`supabase/migrations/20260917_progressive_onboarding.sql`

before deploying the updated registration flow so the new profile fields exist.


## Supplier Verification & Compliance

The supplier workspace now includes `/supplier/verification` with seven verification states: Draft, Submitted, Under Review, More Information Required, Verified, Suspended and Rejected. Suppliers can manage a private compliance document register with issue/expiry dates, issuing authority, version, verification state and reviewer notes. Expiry warnings cover expired documents and documents expiring within 30/90 days.

Migration: `supabase/migrations/20260917_supplier_verification_compliance.sql`. The `supplier-verification-documents` Storage bucket is private and its RLS policies restrict objects to the owning supplier or platform administrators. Public supplier/profile/listing surfaces expose only verification status metadata; document files and reviewer notes are not public.
