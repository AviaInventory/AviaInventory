import { NextResponse, type NextRequest } from "next/server";

/**
 * Account-email links point here (aviainventory.com) rather than straight at Supabase:
 * the company mail server rejects "verify" emails that link to another domain
 * (550 5.7.1 policy). This forwards to Supabase's verify endpoint, which confirms the
 * token and returns the user to /auth/callback.
 *
 *   /auth/confirm?token=<token_hash>&type=<signup|recovery|...>&next=<our callback URL>
 */

const TYPES = new Set(["signup", "recovery", "invite", "magiclink", "email_change", "email"]);

/** Only our own site may be the return address (no open redirect). */
function safeReturnUrl(raw: string | null, request: NextRequest): string {
  const fallback = new URL("/auth/callback", request.nextUrl.origin).toString();
  if (!raw) return fallback;
  try {
    const url = new URL(raw, request.nextUrl.origin);
    const ownHost = url.host === request.nextUrl.host || url.hostname === "aviainventory.com" || url.hostname.endsWith(".aviainventory.com");
    return ownHost && url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token");
  const type = searchParams.get("type") ?? "";
  if (!token || !TYPES.has(type)) {
    return NextResponse.redirect(new URL("/login?message=link-invalid", request.url));
  }
  const verify = new URL("/auth/v1/verify", process.env.NEXT_PUBLIC_SUPABASE_URL);
  verify.searchParams.set("token", token);
  verify.searchParams.set("type", type);
  verify.searchParams.set("redirect_to", safeReturnUrl(searchParams.get("next"), request));
  return NextResponse.redirect(verify);
}
