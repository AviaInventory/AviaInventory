import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { accountBillingType, isPlanAllowed, type BillingInterval, type PlanCode } from "@/lib/billing/plans";
import { changeSubscriptionPlan, createCheckoutSession } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "You must be signed in to subscribe." }, { status: 401 });
    const body = await request.json().catch(() => ({})) as { planCode?: PlanCode; interval?: BillingInterval };
    const planCode = body.planCode;
    const interval = body.interval;
    if (!planCode || !interval || !["month", "year"].includes(interval)) return NextResponse.json({ error: "Choose a valid plan and billing interval." }, { status: 400 });

    const { data: profile } = await supabase.from("profiles").select("account_type,account_roles,email").eq("id", user.id).maybeSingle();
    const roles = Array.isArray(profile?.account_roles) && profile.account_roles.length ? profile.account_roles : [profile?.account_type];
    const accountType = accountBillingType(roles.filter(Boolean) as string[]);
    if (!isPlanAllowed(accountType, planCode)) return NextResponse.json({ error: "That plan is not available for this account type." }, { status: 403 });

    const { data: existing } = await supabase.from("subscriptions").select("id,status,provider_customer_id,provider_subscription_id,plan_code,billing_interval").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (existing?.provider_subscription_id && (existing.status === "active" || existing.status === "past_due")) {
      const updated = await changeSubscriptionPlan({ subscriptionId: existing.provider_subscription_id, planCode, interval });
      return NextResponse.json({ changed: true, subscription: updated });
    }
    const session = await createCheckoutSession({ userId: user.id, email: profile?.email ?? user.email, planCode, interval, customerId: existing?.provider_customer_id ?? null });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("BILLING CHECKOUT ERROR:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start secure checkout." }, { status: 500 });
  }
}
