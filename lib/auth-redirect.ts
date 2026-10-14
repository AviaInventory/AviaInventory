// Shared by the proxy, route handlers and client components; keep it free of
// server-only or browser-only imports.

export type AccountRole = "buyer" | "supplier" | "admin";

/** Paths that need a signed-in user. Unauthenticated requests go to /login?next=… */
export const PROTECTED_PATH_PREFIXES = ["/account", "/buyer", "/supplier"] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Accepts only same-origin relative paths, so `?next=` cannot be used as an
 * open redirect (e.g. `//evil.com` or `https://evil.com`).
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return null;
  }
  return raw;
}

export function loginPath(next?: string | null): string {
  const safe = safeNextPath(next);
  return safe ? `/login?next=${encodeURIComponent(safe)}` : "/login";
}

/** Profiles store the full role set in account_roles; account_type is the legacy single role. */
export function resolveRoles(profile: {
  account_roles?: string[] | null;
  account_type?: string | null;
} | null): AccountRole[] {
  const raw = profile?.account_roles?.length ? profile.account_roles : [profile?.account_type];
  return raw.filter((role): role is AccountRole =>
    role === "buyer" || role === "supplier" || role === "admin",
  );
}

/** Buyer & Supplier accounts land in the selling workspace; they can switch with RoleSwitcher. */
export function dashboardPathForRoles(roles: readonly AccountRole[]): string {
  if (roles.includes("admin")) return "/admin/dashboard";
  if (roles.includes("supplier")) return "/supplier/dashboard";
  return "/buyer/dashboard";
}
