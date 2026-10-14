import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site-config";

const bodySchema = z.object({ email: z.string().trim().email() });

const UNAVAILABLE_MESSAGE = `Password reset is temporarily unavailable. Please try again later or contact us at ${SITE.email}.`;

/**
 * Customer-facing error. In development the technical cause is appended so the
 * developer can see what to fix; in production customers only see `message`.
 */
function errorResponse(status: number, message: string, devDetail?: string) {
  const detail = process.env.NODE_ENV !== "production" && devDetail ? ` [dev: ${devDetail}]` : "";
  return NextResponse.json({ error: message + detail }, { status });
}

/** Explains why the account lookup failed, for logs and development. */
function lookupFailureDetail(error: unknown): string {
  const message = error instanceof Error ? error.message : String((error as { message?: unknown })?.message ?? error);
  if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) return "SUPABASE_SERVICE_ROLE_KEY is not set in the environment.";
  if (message.includes("auth_email_exists")) {
    return "Database function auth_email_exists is missing. Run supabase/migrations/20261013000100_auth_email_exists.sql.";
  }
  return message;
}

/**
 * Sends a password reset link, but only to registered emails.
 * Runs on the server because checking auth.users needs the service role.
 */
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse(400, "Enter a valid email address, for example name@company.com.");
  }
  const { email } = parsed.data;

  let exists: boolean;
  try {
    const { data, error } = await createAdminClient().rpc("auth_email_exists", { p_email: email });
    if (error) throw error;
    exists = Boolean(data);
  } catch (error) {
    const detail = lookupFailureDetail(error);
    console.error("PASSWORD RESET LOOKUP ERROR:", detail);
    return errorResponse(503, UNAVAILABLE_MESSAGE, detail);
  }

  if (!exists) {
    return errorResponse(
      404,
      "We couldn't find an account with that email address. Check the spelling, or create a new account.",
    );
  }

  // The cookie-aware client stores the PKCE verifier in this browser, which
  // /auth/callback needs to complete the reset.
  const supabase = await createClient();
  const redirectTo = new URL("/auth/callback?next=/reset-password", request.nextUrl.origin).toString();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    console.error("PASSWORD RESET SEND ERROR:", error.status, error.message);
    if (error.status === 429) {
      return errorResponse(
        429,
        "You've requested several reset emails in a short time. Please wait a few minutes, then try again.",
        error.message,
      );
    }
    return errorResponse(
      502,
      `We found your account but couldn't send the reset email right now. Please try again shortly or contact us at ${SITE.email}.`,
      error.message,
    );
  }

  return NextResponse.json({ success: true });
}
