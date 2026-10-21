import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { accountBillingType, isPlanAllowed, type BillingInterval, type PlanCode } from "@/lib/billing/plans";
import { chargeAmount } from "@/lib/billing/pricing";
import { initializeCheckout, type PaymentMethod } from "@/lib/billing/paystack";
import { SITE } from "@/lib/site-config";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "You must be signed in to subscribe." }, { status: 401 });

    const body = await request.json().catch(() => ({})) as { planCode?: PlanCode; interval?: BillingInterval; method?: PaymentMethod };
    const { planCode, interval } = body;
    const method: PaymentMethod = body.method === "mpesa" ? "mpesa" : "card";
    if (!planCode || !interval || !["month", "year"].includes(interval)) {
      return NextResponse.json({ error: "Choose a valid plan and billing interval." }, { status: 400 });
    }

    const { data: profile } = await supabase.from("profiles").select("account_type,account_roles,email").eq("id", user.id).maybeSingle();
    const roles = Array.isArray(profile?.account_roles) && profile.account_roles.length ? profile.account_roles : [profile?.account_type];
    const accountType = accountBillingType(roles.filter(Boolean) as string[]);
    if (!isPlanAllowed(accountType, planCode)) {
      return NextResponse.json({ error: "That plan is not available for this account type." }, { status: 403 });
    }

    const { data: current } = await supabase
      .from("subscriptions")
      .select("plan_code,billing_interval,status,payment_method,provider_subscription_id,cancel_at_period_end")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (current?.status === "active" && current.payment_method === "card" && current.provider_subscription_id
      && !current.cancel_at_period_end && current.plan_code === planCode && current.billing_interval === interval) {
      return NextResponse.json({ error: "Your card already renews this plan automatically. Use “Manage card” to change the card." }, { status: 409 });
    }

    const email = profile?.email ?? user.email;
    if (!email) return NextResponse.json({ error: "Add an email address to your account before subscribing." }, { status: 400 });

    // Paystack sends the customer back here with ?reference=…; the page confirms the payment.
    const origin = new URL(request.url).origin;
    const checkout = await initializeCheckout({
      userId: user.id,
      email,
      planCode,
      interval,
      method,
      charge: chargeAmount(planCode, interval),
      callbackUrl: `${origin}/account/subscription?checkout=paystack`,
    });
    return NextResponse.json({ accessCode: checkout.access_code, url: checkout.authorization_url, reference: checkout.reference });
  } catch (error) {
    console.error("BILLING CHECKOUT ERROR:", error);
    // Provider/configuration errors are not meaningful to customers.
    const devDetail = process.env.NODE_ENV !== "production" && error instanceof Error ? ` [dev: ${error.message}]` : "";
    return NextResponse.json(
      { error: `Online payment isn't available right now. Please try again later or contact us at ${SITE.email}.${devDetail}` },
      { status: 503 },
    );
  }
}
