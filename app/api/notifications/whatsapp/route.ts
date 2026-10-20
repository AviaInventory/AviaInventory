import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplate, templateFor, whatsappConfigured } from "@/lib/whatsapp";

/**
 * WhatsApp dispatcher. The database calls this (pg_net) after notifications are created;
 * it claims queued rows, sends their templates and records the result.
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

type QueuedNotification = { id: string; user_id: string; type: string; title: string; message: string | null; link: string | null; whatsapp_number: string | null };

export async function POST(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!whatsappConfigured()) return NextResponse.json({ error: "WhatsApp is not configured." }, { status: 503 });

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_whatsapp_notifications", { p_limit: 20 });
  if (error) {
    console.error("WHATSAPP CLAIM ERROR:", error);
    return NextResponse.json({ error: "Could not load the queue." }, { status: 500 });
  }

  const results = { sent: 0, failed: 0, skipped: 0 };
  for (const row of (data ?? []) as QueuedNotification[]) {
    const message = templateFor(row);
    // Opted out since it was queued, or a type without a template: nothing to send.
    if (!message || !row.whatsapp_number) {
      await admin.from("notifications").update({ whatsapp_status: null, whatsapp_error: message ? "WhatsApp not enabled for this user." : "No WhatsApp template for this type." }).eq("id", row.id);
      results.skipped += 1;
      continue;
    }

    const result = await sendTemplate(row.whatsapp_number, message);
    if (result.ok) {
      await admin.from("notifications").update({ whatsapp_status: "sent", whatsapp_message_id: result.messageId, whatsapp_error: null, whatsapp_sent_at: new Date().toISOString() }).eq("id", row.id);
      results.sent += 1;
    } else {
      console.error("WHATSAPP SEND FAILED:", row.id, message.template, result.error);
      await admin.from("notifications").update({ whatsapp_status: "failed", whatsapp_error: result.error.slice(0, 500) }).eq("id", row.id);
      results.failed += 1;
    }
  }

  return NextResponse.json(results);
}
