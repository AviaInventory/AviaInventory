import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dashboardPathForRoles, resolveRoles, safeNextPath } from "@/lib/auth-redirect";

/**
 * Landing point for Supabase email links (signup confirmation, password reset).
 *
 * Supports both link styles Supabase can send:
 *  - `?code=`                 PKCE flow (default email templates)
 *  - `?token_hash=&type=`     token-hash templates, which also work when the link is
 *                             opened on a different device/browser than the one used to sign up
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));
  const isSignupConfirmation = searchParams.get("flow") === "signup";

  const supabase = await createClient();

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Missing confirmation token") };

  if (isSignupConfirmation) {
    // Product decision: confirming the email does not sign the user in. They sign in
    // with their password, which proves both the address and the credentials.
    // (With PKCE, Supabase has already confirmed the email even if the exchange fails,
    // e.g. when the link is opened in a different browser.)
    if (!error) await supabase.auth.signOut();
    const message = error && !code ? "link-invalid" : "email-confirmed";
    return NextResponse.redirect(new URL(`/login?message=${message}`, request.url));
  }

  if (error) {
    // With PKCE, Supabase confirms the email before redirecting here, so a failed code
    // exchange (e.g. link opened in another browser) usually just means "sign in now".
    const reason = next === "/reset-password" ? "reset-link-invalid" : "link-invalid";
    return NextResponse.redirect(new URL(`/login?message=${reason}`, request.url));
  }

  if (next) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, account_roles")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.redirect(new URL(dashboardPathForRoles(resolveRoles(profile)), request.url));
}
