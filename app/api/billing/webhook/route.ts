import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaystackSignature, verifyTransaction } from "@/lib/billing/paystack";
import { applySuccessfulCharge } from "@/lib/billing/apply-payment";

type PaystackEvent = { event: string; data?: Record<string, unknown> };

function str(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function nested(value: unknown, key: string): string | null {
  return value && typeof value === "object" ? str((value as Record<string, unknown>)[key]) : null;
}

/**
 * Paystack webhook. Configure in Paystack: Settings → API Keys & Webhooks → Webhook URL
 * = https://www.aviainventory.com/api/billing/webhook
 */
export async function POST(request: Request) {
  const payload = await request.text();
  if (!verifyPaystackSignature(payload, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  // Paystack events have no id; the payload hash identifies redeliveries.
  const eventId = crypto.createHash("sha256").update(payload).digest("hex");
  const admin = createAdminClient();
  let event: PaystackEvent;
  try {
    event = JSON.parse(payload) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  try {
    const { data: existing } = await admin.from("billing_events").select("status").eq("provider", "paystack").eq("provider_event_id", eventId).maybeSingle();
    if (existing?.status === "processed" || existing?.status === "ignored") return NextResponse.json({ received: true, duplicate: true });
    if (!existing) {
      const { error } = await admin.from("billing_events").insert({ provider: "paystack", provider_event_id: eventId, event_type: event.event, payload: event });
      if (error && !error.message.toLowerCase().includes("duplicate")) throw error;
    }

    const data = event.data ?? {};
    let outcome: "processed" | "ignored" = "processed";

    if (event.event === "charge.success") {
      const reference = str(data.reference);
      // Re-read the transaction from Paystack rather than trusting the event body.
      const result = reference ? await applySuccessfulCharge(await verifyTransaction(reference)) : null;
      if (!result || (!result.applied && result.reason === "unrecognised")) outcome = "ignored";
    } else if (event.event === "subscription.create") {
      const subscriptionCode = str(data.subscription_code);
      const emailToken = str(data.email_token);
      const planCode = nested(data.plan, "plan_code");
      const customerCode = nested(data.customer, "customer_code");
      const customerEmail = nested(data.customer, "email");
      if (subscriptionCode && emailToken) {
        const { data: byCustomer } = customerCode
          ? await admin.from("subscriptions").select("user_id").eq("provider_customer_id", customerCode).limit(1).maybeSingle()
          : { data: null };
        const { data: byEmail } = !byCustomer && customerEmail
          ? await admin.from("profiles").select("id").ilike("email", customerEmail).limit(1).maybeSingle()
          : { data: null };
        const userId = byCustomer?.user_id ?? byEmail?.id ?? null;
        if (userId) {
          await admin.from("paystack_subscription_tokens").upsert({ subscription_code: subscriptionCode, user_id: userId, paystack_plan_code: planCode, email_token: emailToken }, { onConflict: "subscription_code" });
          if (planCode) {
            await admin.from("subscriptions").update({ provider_subscription_id: subscriptionCode, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("provider_plan_code", planCode);
          }
        } else {
          outcome = "ignored";
        }
      }
    } else if (event.event === "subscription.not_renew" || event.event === "subscription.disable") {
      // The customer cancelled (or we replaced the plan): access continues until the period ends.
      const subscriptionCode = str(data.subscription_code);
      if (subscriptionCode) {
        await admin.from("subscriptions").update({ cancel_at_period_end: true, cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("provider_subscription_id", subscriptionCode);
      }
    } else if (event.event === "invoice.payment_failed") {
      const subscriptionCode = nested(data.subscription, "subscription_code");
      if (subscriptionCode) {
        await admin.from("subscriptions").update({ status: "past_due", updated_at: new Date().toISOString() }).eq("provider_subscription_id", subscriptionCode);
      }
    } else {
      outcome = "ignored";
    }

    await admin.from("billing_events").update({ status: outcome, processed_at: new Date().toISOString(), error_message: null }).eq("provider", "paystack").eq("provider_event_id", eventId);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("BILLING WEBHOOK ERROR:", error);
    await admin.from("billing_events").update({ status: "failed", error_message: error instanceof Error ? error.message : "Webhook processing failed." }).eq("provider", "paystack").eq("provider_event_id", eventId);
    // A non-2xx response makes Paystack retry the event.
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
