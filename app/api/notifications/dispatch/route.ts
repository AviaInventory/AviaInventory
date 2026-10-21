import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { dispatchEmails, dispatchWhatsApp } from "@/lib/notification-dispatch";

/**
 * Notification dispatcher: the database calls this (pg_net) after notifications are
 * created, and it sends the queued emails and WhatsApp messages.
 * Auth: Authorization: Bearer <WHATSAPP_DISPATCH_SECRET>.
 */

function authorised(request: Request): boolean {
  const secret = process.env.WHATSAPP_DISPATCH_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || !header.startsWith("Bearer ")) return false;
  const a = Buffer.from(header.slice("Bearer ".length));
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  // Channels are independent: one being unconfigured or failing does not stop the other.
  const [email, whatsapp] = await Promise.all([dispatchEmails(), dispatchWhatsApp()]);
  return NextResponse.json({ email, whatsapp });
}
