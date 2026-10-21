import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplate, templateFor, whatsappConfigured } from "@/lib/whatsapp";
import { emailConfigured, sendNotificationEmail } from "@/lib/email";

/**
 * Sends queued notifications on their outside channels (email, WhatsApp). The database
 * queues them on insert and calls /api/notifications/dispatch; each run also retries
 * earlier failures (see claim_*_notifications in the migrations).
 */

type Counts = { sent: number; failed: number; skipped: number };
const empty = (): Counts => ({ sent: 0, failed: 0, skipped: 0 });

type QueuedEmail = { id: string; type: string; title: string; message: string | null; link: string | null; email: string | null; full_name: string | null };
type QueuedWhatsApp = { id: string; user_id: string; type: string; title: string; message: string | null; link: string | null; whatsapp_number: string | null };

export async function dispatchEmails(): Promise<Counts | { error: string }> {
  if (!emailConfigured()) return { error: "Email is not configured." };
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_email_notifications", { p_limit: 20 });
  if (error) {
    console.error("EMAIL CLAIM ERROR:", error);
    return { error: "Could not load the email queue." };
  }
  const counts = empty();
  for (const row of (data ?? []) as QueuedEmail[]) {
    if (!row.email) {
      await admin.from("notifications").update({ email_status: null, email_error: "No email address on the account." }).eq("id", row.id);
      counts.skipped += 1;
      continue;
    }
    const result = await sendNotificationEmail({ to: row.email, name: row.full_name, type: row.type, title: row.title, message: row.message, link: row.link });
    if (result.ok) {
      await admin.from("notifications").update({ email_status: "sent", email_error: null, email_sent_at: new Date().toISOString() }).eq("id", row.id);
      counts.sent += 1;
    } else {
      console.error("EMAIL SEND FAILED:", row.id, result.error);
      await admin.from("notifications").update({ email_status: "failed", email_error: result.error.slice(0, 500) }).eq("id", row.id);
      counts.failed += 1;
    }
  }
  return counts;
}

export async function dispatchWhatsApp(): Promise<Counts | { error: string }> {
  if (!whatsappConfigured()) return { error: "WhatsApp is not configured." };
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_whatsapp_notifications", { p_limit: 20 });
  if (error) {
    console.error("WHATSAPP CLAIM ERROR:", error);
    return { error: "Could not load the WhatsApp queue." };
  }
  const counts = empty();
  for (const row of (data ?? []) as QueuedWhatsApp[]) {
    const message = templateFor(row);
    // Opted out since it was queued, or a type without a template: nothing to send.
    if (!message || !row.whatsapp_number) {
      await admin.from("notifications").update({ whatsapp_status: null, whatsapp_error: message ? "WhatsApp not enabled for this user." : "No WhatsApp template for this type." }).eq("id", row.id);
      counts.skipped += 1;
      continue;
    }
    const result = await sendTemplate(row.whatsapp_number, message);
    if (result.ok) {
      await admin.from("notifications").update({ whatsapp_status: "sent", whatsapp_message_id: result.messageId, whatsapp_error: null, whatsapp_sent_at: new Date().toISOString() }).eq("id", row.id);
      counts.sent += 1;
    } else {
      console.error("WHATSAPP SEND FAILED:", row.id, message.template, result.error);
      await admin.from("notifications").update({ whatsapp_status: "failed", whatsapp_error: result.error.slice(0, 500) }).eq("id", row.id);
      counts.failed += 1;
    }
  }
  return counts;
}
