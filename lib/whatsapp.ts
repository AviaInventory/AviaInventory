import "server-only";

/**
 * WhatsApp Cloud API (Meta). Business-initiated messages must use templates approved in
 * WhatsApp Manager; the names and bodies below must match those templates exactly.
 */

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v23.0";
const TEMPLATE_LANGUAGE = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";

export function whatsappConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

type TemplateMessage = { template: string; text: string; buttonPath: string | null };

/** Template parameters may not contain newlines, tabs or 4+ consecutive spaces. */
function clean(value: string, max = 300): string {
  const text = value.replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function firstSentence(value: string): string {
  const match = value.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : value).trim();
}

/**
 * Maps an in-app notification to its WhatsApp template. Templates (Utility, English):
 *   new_rfq_alert              "New RFQ on AviaInventory: {{1}} Open your supplier dashboard to review it and send your quotation."
 *   quote_received_alert       "You have received a new quotation on AviaInventory: {{1}} Compare it with your other quotations on your RFQ page."
 *   order_update_alert         "AviaInventory order update: {{1}} Open the order for full details and next steps."
 *   new_message_alert          "You have a new message on AviaInventory from {{1}}. Reply on the platform to keep the conversation in one place."
 *   verification_update_alert  "Your AviaInventory supplier verification has been updated: {{1}} Open your verification page for details."
 * Each has a dynamic URL button: https://www.aviainventory.com/{{1}}
 */
export function templateFor(notification: { type: string; title: string; message: string | null; link: string | null }): TemplateMessage | null {
  const message = notification.message ?? "";
  const buttonPath = notification.link ? notification.link.replace(/^\/+/, "") : null;
  switch (notification.type) {
    case "rfq":
      return { template: "new_rfq_alert", text: clean(firstSentence(message) || notification.title), buttonPath };
    case "quote":
      return { template: "quote_received_alert", text: clean(firstSentence(message) || notification.title), buttonPath };
    case "order":
      return { template: "order_update_alert", text: clean(firstSentence(message) || notification.title), buttonPath };
    case "message":
      return { template: "new_message_alert", text: clean(notification.title.replace(/^New message from\s+/i, ""), 80), buttonPath };
    case "verification":
      return { template: "verification_update_alert", text: clean(`${notification.title}.`), buttonPath };
    default:
      return null;
  }
}

export type SendResult = { ok: true; messageId: string } | { ok: false; error: string };

/** Sends an approved template. `to` is E.164 (+2547…); the API wants digits only. */
export async function sendTemplate(to: string, message: TemplateMessage): Promise<SendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return { ok: false, error: "WhatsApp is not configured." };

  const components: Array<Record<string, unknown>> = [
    { type: "body", parameters: [{ type: "text", text: message.text }] },
  ];
  if (message.buttonPath) {
    components.push({ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: message.buttonPath }] });
  }

  const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ""),
      type: "template",
      template: { name: message.template, language: { code: TEMPLATE_LANGUAGE }, components },
    }),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as { messages?: Array<{ id?: string }>; error?: { message?: string; code?: number } };
  if (!response.ok || !body.messages?.[0]?.id) {
    const error = body.error ? `${body.error.code ?? response.status}: ${body.error.message ?? "request failed"}` : `HTTP ${response.status}`;
    return { ok: false, error };
  }
  return { ok: true, messageId: body.messages[0].id };
}

