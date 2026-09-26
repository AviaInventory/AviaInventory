AviaInventory Admin Navigation Security Changes

Public navigation:
- Removed the Admin link from components/layout/Navbar.tsx.

Private administrator login:
- Moved from /admin/login to /platform-console/login.
- The new route is intentionally not linked anywhere in the public navigation.
- The route emits noindex, nofollow, nocache metadata.
- app/robots.ts disallows /platform-console/login.

Admin dashboard:
- Unauthenticated access redirects to /platform-console/login.
- Admin logout also redirects to /platform-console/login.
