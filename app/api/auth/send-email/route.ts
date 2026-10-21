import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/email";

/**
 * Supabase Auth "Send Email" hook. Supabase cannot reach the company mail server
 * (Host Africa), so instead of sending sign-up / password emails itself it calls this
 * route, and we send them from no-reply@aviainventory.com with the 6-digit code.
 *
 * Supabase: Authentication -> Hooks -> Send Email -> HTTPS
 *   URL:    https://www.aviainventory.com/api/auth/send-email
 *   Secret: SUPABASE_SEND_EMAIL_HOOK_SECRET ("v1,whsec_...")
 */

const SITE_ORIGIN = "https://www.aviainventory.com";

/** Standard Webhooks signature check (what Supabase uses for Auth hooks). */
function verifySignature(payload: string, headers: Headers): boolean {
  const secret = process.env.SUPABASE_SEND_EMAIL_HOOK_SECRET ?? "";
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatures = headers.get("webhook-signature");
  if (!secret || !id || !timestamp || !signatures) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 5 * 60) return false;
  const key = Buffer.from(secret.replace(/^v1,/, "").replace(/^whsec_/, ""), "base64");
  const expected = crypto.createHmac("sha256", key).update(`${id}.${timestamp}.${payload}`).digest();
  return signatures.split(" ").some((entry) => {
    const [version, value] = entry.split(",");
    if (version !== "v1" || !value) return false;
    const given = Buffer.from(value, "base64");
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  });
}

type HookPayload = {
  user: { email?: string; new_email?: string; user_metadata?: { full_name?: string } };
  email_data: { token?: string; token_hash?: string; redirect_to?: string; email_action_type?: string; site_url?: string };
};

const button = (href: string, label: string) =>
  `<a href="${escapeHtml(href)}" style="display:inline-block;background:#0d5bd7;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px">${label}</a>`;
const codeBlock = (code: string) =>
  `<p style="margin:0 0 20px;font-size:32px;font-weight:700;letter-spacing:8px;color:#06233f">${escapeHtml(code)}</p>`;

function buildEmail(payload: HookPayload) {
  const { email_data: data, user } = payload;
  const type = data.email_action_type ?? "";
  const code = data.token ?? "";
  // Same link Supabase would send: it verifies the token, then returns to our /auth/callback.
  const link = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${encodeURIComponent(data.token_hash ?? "")}&type=${encodeURIComponent(type)}&redirect_to=${encodeURIComponent(data.redirect_to || SITE_ORIGIN)}`;
  const firstName = user.user_metadata?.full_name?.split(" ")[0];
  const hello = `<p style="margin:0 0 12px;font-size:15px">${escapeHtml(firstName ? `Hello ${firstName},` : "Hello,")}</p>`;
  const ignore = "If you didn't request this, you can ignore this email.";

  switch (type) {
    case "signup":
      return {
        subject: "Your AviaInventory verification code",
        html: emailLayout(`${hello}<h1 style="margin:0 0 8px;font-size:20px;color:#05529b">Verify your email</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.55">Enter this code on the AviaInventory page to confirm your email address:</p>${codeBlock(code)}
<p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#33506d">Or confirm with the button below.</p>${button(link, "Confirm my email")}`, ignore),
        text: `Your AviaInventory verification code: ${code}\n\nOr confirm here: ${link}\n\n${ignore}`,
      };
    case "recovery":
      return {
        subject: "Reset your AviaInventory password",
        html: emailLayout(`${hello}<h1 style="margin:0 0 8px;font-size:20px;color:#05529b">Reset your password</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.55">Use the button below to choose a new password. The link expires soon and can be used once.</p>${button(link, "Reset password")}`, ignore),
        text: `Reset your AviaInventory password: ${link}\n\n${ignore}`,
      };
    case "email_change":
      return {
        subject: "Confirm your new AviaInventory email",
        html: emailLayout(`${hello}<h1 style="margin:0 0 8px;font-size:20px;color:#05529b">Confirm your email change</h1>
${code ? `<p style="margin:0 0 16px;font-size:15px">Your code:</p>${codeBlock(code)}` : ""}${button(link, "Confirm email change")}`, ignore),
        text: `Confirm your AviaInventory email change${code ? ` (code ${code})` : ""}: ${link}\n\n${ignore}`,
      };
    case "magiclink":
      return {
        subject: "Your AviaInventory sign-in link",
        html: emailLayout(`${hello}<h1 style="margin:0 0 8px;font-size:20px;color:#05529b">Sign in to AviaInventory</h1>
${code ? `<p style="margin:0 0 16px;font-size:15px">Your code:</p>${codeBlock(code)}` : ""}${button(link, "Sign in")}`, ignore),
        text: `Sign in to AviaInventory${code ? ` (code ${code})` : ""}: ${link}\n\n${ignore}`,
      };
    default:
      return {
        subject: "Your AviaInventory security code",
        html: emailLayout(`${hello}<h1 style="margin:0 0 8px;font-size:20px;color:#05529b">Your security code</h1>${code ? codeBlock(code) : ""}${data.token_hash ? button(link, "Continue") : ""}`, ignore),
        text: `Your AviaInventory security code: ${code}\n${data.token_hash ? link : ""}\n\n${ignore}`,
      };
  }
}

// Supabase treats any non-2xx response as a failed email and stops the sign-up.
const fail = (status: number, message: string) => NextResponse.json({ error: { http_code: status, message } }, { status });

export async function POST(request: Request) {
  const payload = await request.text();
  if (!verifySignature(payload, request.headers)) return fail(401, "Invalid signature.");

  let body: HookPayload;
  try {
    body = JSON.parse(payload) as HookPayload;
  } catch {
    return fail(400, "Invalid payload.");
  }
  const to = body.email_data?.email_action_type === "email_change" && body.user?.new_email ? body.user.new_email : body.user?.email;
  if (!to) return fail(400, "No recipient.");

  const email = buildEmail(body);
  const result = await sendEmail({ to, ...email });
  if (!result.ok) {
    console.error("AUTH EMAIL SEND FAILED:", body.email_data?.email_action_type, result.error);
    return fail(500, "The email could not be sent.");
  }
  return NextResponse.json({});
}
