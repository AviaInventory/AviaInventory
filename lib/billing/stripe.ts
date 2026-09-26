import "server-only";
import crypto from "node:crypto";
import { type BillingInterval, type PlanCode } from "@/lib/billing/plans";

const STRIPE_API = "https://api.stripe.com/v1";

function secretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe billing is not configured. Set STRIPE_SECRET_KEY.");
  return key;
}

export function stripePriceId(planCode: PlanCode, interval: BillingInterval): string {
  const map: Partial<Record<PlanCode, { month?: string; year?: string }>> = {
    buyer_basic: { month: process.env.STRIPE_PRICE_BUYER_BASIC_MONTHLY, year: process.env.STRIPE_PRICE_BUYER_BASIC_ANNUAL },
    hybrid_basic: { month: process.env.STRIPE_PRICE_HYBRID_BASIC_MONTHLY, year: process.env.STRIPE_PRICE_HYBRID_BASIC_ANNUAL },
    hybrid_bronze: { month: process.env.STRIPE_PRICE_HYBRID_BRONZE_MONTHLY, year: process.env.STRIPE_PRICE_HYBRID_BRONZE_ANNUAL },
    hybrid_platinum: { month: process.env.STRIPE_PRICE_HYBRID_PLATINUM_MONTHLY, year: process.env.STRIPE_PRICE_HYBRID_PLATINUM_ANNUAL },
  };
  const value = map[planCode]?.[interval];
  if (!value) throw new Error(`No Stripe price is configured for ${planCode} (${interval}).`);
  return value;
}

async function stripeRequest(path: string, params: URLSearchParams, method = "POST") {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: method === "GET" ? undefined : params.toString(),
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message ?? "Payment provider request failed.");
  return body as Record<string, unknown>;
}

export async function createCheckoutSession(input: {
  userId: string;
  email?: string | null;
  planCode: PlanCode;
  interval: BillingInterval;
  customerId?: string | null;
}) {
  const priceId = stripePriceId(input.planCode, input.interval);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("success_url", `${baseUrl}/account/subscription?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${baseUrl}/pricing?checkout=cancelled`);
  params.set("client_reference_id", input.userId);
  params.set("metadata[user_id]", input.userId);
  params.set("metadata[plan_code]", input.planCode);
  params.set("metadata[billing_interval]", input.interval);
  params.set("subscription_data[metadata][user_id]", input.userId);
  params.set("subscription_data[metadata][plan_code]", input.planCode);
  params.set("subscription_data[metadata][billing_interval]", input.interval);
  if (input.customerId) params.set("customer", input.customerId);
  else if (input.email) params.set("customer_email", input.email);
  return stripeRequest("/checkout/sessions", params);
}

async function stripeGet(path: string) {
  const response = await fetch(`${STRIPE_API}${path}`, { headers: { Authorization: `Bearer ${secretKey()}` }, cache: "no-store" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message ?? "Payment provider request failed.");
  return body as Record<string, unknown>;
}

export async function changeSubscriptionPlan(input: { subscriptionId: string; planCode: PlanCode; interval: BillingInterval }) {
  const priceId = stripePriceId(input.planCode, input.interval);
  const current = await stripeGet(`/subscriptions/${encodeURIComponent(input.subscriptionId)}`);
  const items = Array.isArray(current.items) ? current.items as Array<Record<string, unknown>> : [];
  const firstItem = items[0];
  const itemId = typeof firstItem?.id === "string" ? firstItem.id : null;
  if (!itemId) throw new Error("The payment provider subscription item could not be found.");
  const params = new URLSearchParams();
  params.set("items[0][id]", itemId);
  params.set("items[0][price]", priceId);
  params.set("proration_behavior", "create_prorations");
  return stripeRequest(`/subscriptions/${encodeURIComponent(input.subscriptionId)}`, params);
}

export async function createBillingPortalSession(customerId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const params = new URLSearchParams({ customer: customerId, return_url: `${baseUrl}/account/subscription` });
  return stripeRequest("/billing_portal/sessions", params);
}

export function verifyStripeSignature(payload: string, signature: string, toleranceSeconds = 300): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Stripe webhook signing secret is not configured.");
  const parts = signature.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Math.floor(Date.now() / 1000) - timestampNumber) > toleranceSeconds) return false;
  const signed = `${timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex");
  return signatures.some((candidate) => {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(candidate, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}
