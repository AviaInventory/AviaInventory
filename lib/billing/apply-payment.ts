import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan, type BillingInterval, type PlanCode } from "@/lib/billing/plans";
import { disableSubscription, type CheckoutMetadata, type PaymentMethod, type PaystackTransaction } from "@/lib/billing/paystack";

type ApplyResult =
  | { applied: true; planName: string; periodEnd: string }
  | { applied: false; reason: "not_successful" | "duplicate" | "unrecognised" | "amount_mismatch" };

function addInterval(start: Date, interval: BillingInterval): Date {
  const end = new Date(start);
  if (interval === "year") end.setUTCFullYear(end.getUTCFullYear() + 1);
  else end.setUTCMonth(end.getUTCMonth() + 1);
  return end;
}

function readMetadata(tx: PaystackTransaction): Partial<CheckoutMetadata> {
  if (!tx.metadata) return {};
  if (typeof tx.metadata === "string") {
    try { return JSON.parse(tx.metadata) as Partial<CheckoutMetadata>; } catch { return {}; }
  }
  return tx.metadata;
}

function transactionPlanCode(tx: PaystackTransaction): string | null {
  if (tx.plan_object?.plan_code) return tx.plan_object.plan_code;
  if (tx.plan && typeof tx.plan === "object" && tx.plan.plan_code) return tx.plan.plan_code;
  if (typeof tx.plan === "string" && tx.plan.startsWith("PLN_")) return tx.plan;
  return null;
}

/**
 * Applies a verified, successful Paystack charge to the user's subscription. Safe to call
 * more than once for the same transaction (the callback page and the webhook both do):
 * the billing_invoices row keyed by the reference is claimed first, so a period is added once.
 */
export async function applySuccessfulCharge(tx: PaystackTransaction): Promise<ApplyResult> {
  if (tx.status !== "success") return { applied: false, reason: "not_successful" };
  const admin = createAdminClient();
  const metadata = readMetadata(tx);
  const paystackPlanCode = transactionPlanCode(tx);
  const customerCode = tx.customer?.customer_code ?? null;

  // Who paid for what: our checkout metadata, or (card renewals) the stored subscription.
  let userId: string | null = null;
  let planCode: PlanCode | null = null;
  let interval: BillingInterval = "month";
  let method: PaymentMethod = "card";

  if (metadata.kind === "avia_subscription" && metadata.user_id && metadata.plan_code) {
    if (tx.amount !== metadata.expected_amount_minor || tx.currency !== metadata.expected_currency) {
      console.error("PAYSTACK AMOUNT MISMATCH:", tx.reference, tx.amount, tx.currency, metadata);
      return { applied: false, reason: "amount_mismatch" };
    }
    userId = metadata.user_id;
    planCode = metadata.plan_code;
    interval = metadata.billing_interval === "year" ? "year" : "month";
    method = metadata.payment_method === "mpesa" ? "mpesa" : "card";
  } else if (paystackPlanCode && customerCode) {
    const { data: row } = await admin
      .from("subscriptions")
      .select("user_id,plan_code,billing_interval")
      .eq("provider", "paystack").eq("provider_customer_id", customerCode).eq("provider_plan_code", paystackPlanCode)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (row) {
      userId = row.user_id;
      planCode = row.plan_code as PlanCode;
      interval = row.billing_interval === "year" ? "year" : "month";
    }
  }

  const plan = getPlan(planCode);
  if (!userId || !plan) return { applied: false, reason: "unrecognised" };

  const { data: current } = await admin
    .from("subscriptions")
    .select("id,plan_code,billing_interval,status,current_period_end,provider_subscription_id")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();

  // Paying again for the same plan while it is still running extends it; anything else starts now.
  const now = new Date();
  const currentEnd = current?.current_period_end ? new Date(current.current_period_end) : null;
  const extends_ = current?.status === "active" && current.plan_code === plan.code && current.billing_interval === interval && currentEnd !== null && currentEnd > now;
  const periodStart = extends_ ? currentEnd! : now;
  const periodEnd = addInterval(periodStart, interval);

  // Claim this transaction. If the row already exists, it was applied before.
  const { data: claimed, error: claimError } = await admin
    .from("billing_invoices")
    .upsert({
      user_id: userId,
      subscription_id: current?.id ?? null,
      provider: "paystack",
      provider_invoice_id: tx.reference,
      currency: tx.currency,
      amount_due_cents: tx.amount,
      amount_paid_cents: tx.amount,
      status: "paid",
      payment_channel: tx.channel,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      paid_at: tx.paid_at ?? now.toISOString(),
    }, { onConflict: "provider,provider_invoice_id", ignoreDuplicates: true })
    .select("id");
  if (claimError) throw claimError;
  if (!claimed?.length) return { applied: false, reason: "duplicate" };

  // A card subscription for a different plan (or a switch to M-Pesa) must stop renewing.
  const newCardPlan = method === "card" ? paystackPlanCode : null;
  if (current?.provider_subscription_id) {
    const { data: oldToken } = await admin
      .from("paystack_subscription_tokens")
      .select("subscription_code,email_token,paystack_plan_code")
      .eq("subscription_code", current.provider_subscription_id).maybeSingle();
    if (oldToken && oldToken.paystack_plan_code !== newCardPlan) {
      await disableSubscription(oldToken.subscription_code, oldToken.email_token).catch((error) => console.error("PAYSTACK DISABLE OLD SUBSCRIPTION:", error));
    }
  }
  // subscription.create may have arrived before this charge; pick up its code if so.
  const { data: newToken } = newCardPlan
    ? await admin.from("paystack_subscription_tokens").select("subscription_code").eq("user_id", userId).eq("paystack_plan_code", newCardPlan).order("created_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };

  const patch = {
    account_type: plan.accountType,
    plan_code: plan.code,
    billing_interval: interval,
    status: "active",
    provider: "paystack",
    provider_customer_id: customerCode,
    provider_plan_code: newCardPlan,
    provider_subscription_id: newCardPlan ? (newToken?.subscription_code ?? (current?.provider_subscription_id && extends_ ? current.provider_subscription_id : null)) : null,
    payment_method: method,
    trial_started_at: null,
    trial_ends_at: null,
    current_period_start: periodStart.toISOString(),
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: false,
    cancelled_at: null,
    updated_at: now.toISOString(),
  };

  const { error: updateError } = current?.id
    ? await admin.from("subscriptions").update(patch).eq("id", current.id)
    : await admin.from("subscriptions").insert({ user_id: userId, ...patch });
  if (updateError) {
    // Release the claim so a retry (webhook redelivery) can apply it.
    await admin.from("billing_invoices").delete().eq("provider", "paystack").eq("provider_invoice_id", tx.reference);
    throw updateError;
  }

  const until = periodEnd.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  await admin.from("notifications").insert({
    user_id: userId,
    type: "billing",
    title: "Payment received",
    message: `${plan.name} is active until ${until}.${method === "card" ? " It renews automatically." : " Pay again with M-Pesa before then to continue."}`,
    link: "/account/subscription",
  });

  return { applied: true, planName: plan.name, periodEnd: periodEnd.toISOString() };
}
