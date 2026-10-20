import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * WhatsApp Cloud API webhook.
 * Meta: App → WhatsApp → Configuration → Webhook
 *   Callback URL: https://www.aviainventory.com/api/whatsapp/webhook
 *   Verify token: WHATSAPP_WEBHOOK_VERIFY_TOKEN
 *   Subscribe to: messages
 */

// Meta's one-time check when the webhook is saved: echo hub.challenge if the token matches.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (expected && params.get("hub.mode") === "subscribe" && params.get("hub.verify_token") === expected) {
    return new Response(params.get("hub.challenge") ?? "", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return NextResponse.json({ error: "Verification failed." }, { status: 403 });
}

/** Meta signs each delivery with HMAC-SHA256 of the raw body, keyed with the App secret. */
function validSignature(payload: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(header.slice("sha256=".length), "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

type WebhookValue = {
  metadata?: { phone_number_id?: string };
  statuses?: Array<{ id?: string; status?: string; recipient_id?: string; errors?: Array<{ code?: number; title?: string }> }>;
  messages?: Array<{ id?: string; from?: string; type?: string }>;
};

export async function POST(request: Request) {
  const payload = await request.text();
  if (!validSignature(payload, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  try {
    const body = JSON.parse(payload) as { entry?: Array<{ changes?: Array<{ field?: string; value?: WebhookValue }> }> };
    const rows: Array<Record<string, unknown>> = [];
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        const phoneNumberId = value.metadata?.phone_number_id ?? null;
        for (const status of value.statuses ?? []) {
          rows.push({ event_kind: "status", wa_message_id: status.id ?? null, phone_number_id: phoneNumberId, from_number: status.recipient_id ?? null, status: status.status ?? null, payload: status });
        }
        for (const message of value.messages ?? []) {
          rows.push({ event_kind: "message", wa_message_id: message.id ?? null, phone_number_id: phoneNumberId, from_number: message.from ?? null, status: message.type ?? null, payload: message });
        }
        if (!value.statuses?.length && !value.messages?.length) {
          rows.push({ event_kind: "other", phone_number_id: phoneNumberId, status: change.field ?? null, payload: change });
        }
      }
    }
    if (rows.length) {
      const admin = createAdminClient();
      const { error } = await admin.from("whatsapp_events").insert(rows);
      if (error) throw error;
      // A message WhatsApp could not deliver (e.g. number not on WhatsApp) is final: no retries.
      for (const entry of body.entry ?? []) for (const change of entry.changes ?? []) for (const status of change.value?.statuses ?? []) {
        if (status.status === "failed" && status.id) {
          const reason = status.errors?.[0] ? `${status.errors[0].code ?? ""} ${status.errors[0].title ?? ""}`.trim() : "Delivery failed";
          await admin.from("notifications").update({ whatsapp_status: "failed", whatsapp_attempts: 3, whatsapp_error: reason.slice(0, 500) }).eq("whatsapp_message_id", status.id);
        }
      }
    }
  } catch (error) {
    // Still acknowledge: Meta retries non-200 responses for days, and a bad payload won't improve.
    console.error("WHATSAPP WEBHOOK ERROR:", error);
  }
  return NextResponse.json({ received: true });
}
