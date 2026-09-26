import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyStripeSignature } from "@/lib/billing/stripe";

function unixToIso(value: unknown): string | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? new Date(number * 1000).toISOString() : null;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();
  if (!signature) return NextResponse.json({ error: "Missing webhook signature." }, { status: 400 });
  try {
    if (!verifyStripeSignature(payload, signature)) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    const event = JSON.parse(payload) as { id: string; type: string; data?: { object?: Record<string, unknown> } };
    const admin = createAdminClient();
    const { data: existing } = await admin.from("billing_events").select("id,status").eq("provider", "stripe").eq("provider_event_id", event.id).maybeSingle();
    if (existing?.status === "processed") return NextResponse.json({ received: true, duplicate: true });
    if (!existing) {
      const { error } = await admin.from("billing_events").insert({ provider: "stripe", provider_event_id: event.id, event_type: event.type, payload: event });
      if (error && !error.message.toLowerCase().includes("duplicate")) throw error;
    }

    const object = event.data?.object ?? {};
    const metadata = (object.metadata ?? {}) as Record<string, string>;
    const userId = metadata.user_id ?? (typeof object.client_reference_id === "string" ? object.client_reference_id : null);

    if (event.type === "checkout.session.completed") {
      const subscriptionId = typeof object.subscription === "string" ? object.subscription : null;
      const customerId = typeof object.customer === "string" ? object.customer : null;
      if (userId && subscriptionId) {
        const planCode = metadata.plan_code;
        const interval = metadata.billing_interval === "year" ? "year" : "month";
        const { data: profile } = await admin.from("profiles").select("account_roles,account_type").eq("id", userId).maybeSingle();
        const roles = Array.isArray(profile?.account_roles) && profile.account_roles.length ? profile.account_roles : [profile?.account_type];
        const accountType = roles.includes("supplier") ? "hybrid" : "buyer";
        const { data: current } = await admin.from("subscriptions").select("id").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (planCode && current?.id) {
          await admin.from("subscriptions").update({ account_type: accountType, plan_code: planCode, billing_interval: interval, status: "active", provider: "stripe", provider_customer_id: customerId, provider_subscription_id: subscriptionId, trial_started_at: null, trial_ends_at: null, current_period_start: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", current.id);
        }
      }
    }

    if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      const providerSubscriptionId = typeof object.id === "string" ? object.id : null;
      const customerId = typeof object.customer === "string" ? object.customer : null;
      const status = event.type === "customer.subscription.deleted" ? "cancelled" : object.status === "past_due" ? "past_due" : object.status === "incomplete" ? "incomplete" : "active";
      const currentPeriodStart = unixToIso(object.current_period_start);
      const currentPeriodEnd = unixToIso(object.current_period_end);
      if (providerSubscriptionId) {
        const patch = { status, provider_customer_id: customerId, current_period_start: currentPeriodStart, current_period_end: currentPeriodEnd, cancel_at_period_end: Boolean(object.cancel_at_period_end), cancelled_at: event.type === "customer.subscription.deleted" ? new Date().toISOString() : null, updated_at: new Date().toISOString() };
        await admin.from("subscriptions").update(patch).eq("provider_subscription_id", providerSubscriptionId);
      }
    }

    if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const invoiceId = typeof object.id === "string" ? object.id : null;
      const customerId = typeof object.customer === "string" ? object.customer : null;
      const subscriptionId = typeof object.subscription === "string" ? object.subscription : null;
      const status = event.type === "invoice.paid" ? "paid" : "payment_failed";
      const { data: subscription } = subscriptionId ? await admin.from("subscriptions").select("id,user_id").eq("provider_subscription_id", subscriptionId).maybeSingle() : { data: null };
      if (invoiceId && subscription?.user_id) {
        await admin.from("billing_invoices").upsert({ user_id: subscription.user_id, subscription_id: subscription.id, provider: "stripe", provider_invoice_id: invoiceId, currency: typeof object.currency === "string" ? object.currency.toUpperCase() : "USD", amount_due_cents: Number(object.amount_due ?? 0), amount_paid_cents: Number(object.amount_paid ?? 0), status, hosted_invoice_url: typeof object.hosted_invoice_url === "string" ? object.hosted_invoice_url : null, invoice_pdf_url: typeof object.invoice_pdf === "string" ? object.invoice_pdf : null, period_start: unixToIso(object.period_start), period_end: unixToIso(object.period_end), paid_at: event.type === "invoice.paid" ? new Date().toISOString() : null }, { onConflict: "provider,provider_invoice_id" });
        if (event.type === "invoice.payment_failed") await admin.from("subscriptions").update({ status: "past_due", updated_at: new Date().toISOString() }).eq("id", subscription.id);
        if (event.type === "invoice.paid") await admin.from("subscriptions").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", subscription.id);
      } else if (customerId) {
        await admin.from("subscriptions").update({ status: event.type === "invoice.paid" ? "active" : "past_due", updated_at: new Date().toISOString() }).eq("provider_customer_id", customerId);
      }
    }

    await admin.from("billing_events").update({ status: "processed", processed_at: new Date().toISOString(), error_message: null }).eq("provider", "stripe").eq("provider_event_id", event.id);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("BILLING WEBHOOK ERROR:", error);
    try {
      const admin = createAdminClient();
      const event = JSON.parse(payload) as { id?: string };
      if (event.id) await admin.from("billing_events").update({ status: "failed", error_message: error instanceof Error ? error.message : "Webhook processing failed." }).eq("provider", "stripe").eq("provider_event_id", event.id);
    } catch { /* preserve original webhook failure */ }
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
