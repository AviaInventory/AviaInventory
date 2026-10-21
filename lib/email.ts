import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { SITE } from "@/lib/site-config";

/**
 * Notification emails, sent through the company mail server (Host Africa) as
 * no-reply@aviainventory.com. Replies go to the team that handles the topic.
 */

const SITE_ORIGIN = "https://www.aviainventory.com";

let transporter: Transporter | null = null;

export function emailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // 587 upgrades with STARTTLS
      requireTLS: port !== 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

/** Which company mailbox a reply should reach. */
function replyToFor(type: string): string {
  if (type === "rfq" || type === "quote") return SITE.emails.sales;
  if (type === "order" || type === "billing") return SITE.emails.billing;
  return SITE.emails.support;
}

export const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type NotificationEmail = {
  to: string;
  name: string | null;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
};

function render(email: NotificationEmail) {
  const url = `${SITE_ORIGIN}${email.link?.startsWith("/") ? email.link : "/"}`;
  const greeting = email.name ? `Hello ${email.name.split(" ")[0]},` : "Hello,";
  const message = email.message ?? "";
  const text = `${greeting}\n\n${email.title}\n${message}\n\nOpen AviaInventory: ${url}\n\n` +
    `You receive this because of your notification settings: ${SITE_ORIGIN}/account/notifications\n${SITE.legalEntity}, Nairobi, Kenya`;
  const html = `<!doctype html><html><body style="margin:0;background:#f2f6fa;font-family:Segoe UI,Arial,sans-serif;color:#12304d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f6fa;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dbe5ef">
<tr><td style="background:#06233f;padding:18px 24px;color:#ffffff;font-size:18px;font-weight:700">AviaInventory</td></tr>
<tr><td style="padding:24px">
<p style="margin:0 0 12px;font-size:15px">${escapeHtml(greeting)}</p>
<h1 style="margin:0 0 8px;font-size:20px;color:#05529b">${escapeHtml(email.title)}</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#33506d">${escapeHtml(message)}</p>
<a href="${escapeHtml(url)}" style="display:inline-block;background:#0d5bd7;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px">Open AviaInventory</a>
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #eef3f8;font-size:12px;line-height:1.5;color:#6b8299">
You receive this because of your <a href="${SITE_ORIGIN}/account/notifications" style="color:#0d5bd7">notification settings</a>.
This mailbox is not monitored; reply to reach our team.<br>${escapeHtml(SITE.legalEntity)} · Nairobi, Kenya
</td></tr></table></td></tr></table></body></html>`;
  return { text, html };
}

export type EmailResult = { ok: true } | { ok: false; error: string };

/** Branded wrapper shared by notification and account (sign-up, password) emails. */
export function emailLayout(innerHtml: string, footerHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f2f6fa;font-family:Segoe UI,Arial,sans-serif;color:#12304d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f6fa;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dbe5ef">
<tr><td style="background:#06233f;padding:18px 24px;color:#ffffff;font-size:18px;font-weight:700">AviaInventory</td></tr>
<tr><td style="padding:24px">${innerHtml}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #eef3f8;font-size:12px;line-height:1.5;color:#6b8299">${footerHtml}<br>${escapeHtml(SITE.legalEntity)} · Nairobi, Kenya</td></tr>
</table></td></tr></table></body></html>`;
}

/** Sends one email from no-reply@ (account emails, notifications). */
export async function sendEmail(message: { to: string; subject: string; html: string; text: string; replyTo?: string }): Promise<EmailResult> {
  if (!emailConfigured()) return { ok: false, error: "Email is not configured." };
  try {
    await getTransporter().sendMail({
      from: { name: "AviaInventory", address: process.env.SMTP_USER! },
      to: message.to,
      replyTo: message.replyTo ?? SITE.emails.support,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sending failed." };
  }
}

export async function sendNotificationEmail(email: NotificationEmail): Promise<EmailResult> {
  if (!emailConfigured()) return { ok: false, error: "Email is not configured." };
  const { text, html } = render(email);
  try {
    await getTransporter().sendMail({
      from: { name: "AviaInventory", address: process.env.SMTP_USER! },
      to: email.name ? { name: email.name, address: email.to } : email.to,
      replyTo: replyToFor(email.type),
      subject: `${email.title} · AviaInventory`,
      text,
      html,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sending failed." };
  }
}
