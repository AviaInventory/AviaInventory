import "server-only";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan, type BillingInterval, type PlanCode } from "@/lib/billing/plans";
import type { ChargeAmount } from "@/lib/billing/pricing";

const PAYSTACK_API = "https://api.paystack.co";

export type PaymentMethod = "card" | "mpesa";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Paystack billing is not configured. Set PAYSTACK_SECRET_KEY.");
  return key;
}

async function paystack<T = Record<string, unknown>>(path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${PAYSTACK_API}${path}`, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = (await response.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!response.ok || json.status === false) throw new Error(json.message ?? `Paystack request failed (${response.status}).`);
  return json.data as T;
}

/** Card subscriptions need a Paystack plan with the exact amount; create it once and cache it. */
async function ensurePaystackPlan(planCode: PlanCode, interval: BillingInterval, charge: ChargeAmount): Promise<string> {
  const admin = createAdminClient();
  const { data: cached } = await admin
    .from("paystack_plans")
    .select("paystack_plan_code")
    .eq("plan_code", planCode).eq("billing_interval", interval).eq("currency", charge.currency).eq("amount_minor", charge.amountMinor)
    .maybeSingle();
  if (cached?.paystack_plan_code) return cached.paystack_plan_code;

  const plan = getPlan(planCode);
  const created = await paystack<{ plan_code: string }>("/plan", {
    body: {
      name: `AviaInventory ${plan?.name ?? planCode} (${interval === "year" ? "Annual" : "Monthly"}) ${charge.currency} ${charge.amount}`,
      interval: interval === "year" ? "annually" : "monthly",
      amount: charge.amountMinor,
      currency: charge.currency,
    },
  });
  // A concurrent checkout may have cached the same plan; keep whichever row won.
  await admin.from("paystack_plans").upsert(
    { plan_code: planCode, billing_interval: interval, currency: charge.currency, amount_minor: charge.amountMinor, paystack_plan_code: created.plan_code },
    { onConflict: "plan_code,billing_interval,currency,amount_minor", ignoreDuplicates: true },
  );
  const { data: winner } = await admin
    .from("paystack_plans")
    .select("paystack_plan_code")
    .eq("plan_code", planCode).eq("billing_interval", interval).eq("currency", charge.currency).eq("amount_minor", charge.amountMinor)
    .maybeSingle();
  return winner?.paystack_plan_code ?? created.plan_code;
}

export type CheckoutMetadata = {
  kind: "avia_subscription";
  user_id: string;
  plan_code: PlanCode;
  billing_interval: BillingInterval;
  payment_method: PaymentMethod;
  expected_amount_minor: number;
  expected_currency: string;
};

export async function initializeCheckout(input: {
  userId: string;
  email: string;
  planCode: PlanCode;
  interval: BillingInterval;
  method: PaymentMethod;
  charge: ChargeAmount;
  callbackUrl: string;
}) {
  const metadata: CheckoutMetadata = {
    kind: "avia_subscription",
    user_id: input.userId,
    plan_code: input.planCode,
    billing_interval: input.interval,
    payment_method: input.method,
    expected_amount_minor: input.charge.amountMinor,
    expected_currency: input.charge.currency,
  };
  const body: Record<string, unknown> = {
    email: input.email,
    amount: input.charge.amountMinor,
    currency: input.charge.currency,
    reference: `AVIA-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    callback_url: input.callbackUrl,
    metadata,
    // M-Pesa is Paystack's "mobile_money" channel in Kenya.
    channels: input.method === "card" ? ["card"] : ["mobile_money"],
  };
  // Cards renew automatically through a Paystack subscription.
  if (input.method === "card") body.plan = await ensurePaystackPlan(input.planCode, input.interval, input.charge);
  // access_code opens Paystack's pop-up on our page; authorization_url is the redirect fallback.
  return paystack<{ authorization_url: string; access_code: string; reference: string }>("/transaction/initialize", { body });
}

export type PaystackTransaction = {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel: string;
  paid_at: string | null;
  metadata: Partial<CheckoutMetadata> | string | null;
  customer: { customer_code: string; email: string } | null;
  plan?: { plan_code?: string } | string | null;
  plan_object?: { plan_code?: string } | null;
};

export function verifyTransaction(reference: string) {
  return paystack<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export async function subscriptionManageLink(subscriptionCode: string): Promise<string> {
  const data = await paystack<{ link: string }>(`/subscription/${encodeURIComponent(subscriptionCode)}/manage/link`);
  return data.link;
}

export async function disableSubscription(subscriptionCode: string, emailToken: string) {
  await paystack("/subscription/disable", { body: { code: subscriptionCode, token: emailToken } });
}

/** Paystack signs webhooks with HMAC-SHA512 of the raw body, keyed with the secret key. */
export function verifyPaystackSignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha512", secretKey()).update(payload).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
