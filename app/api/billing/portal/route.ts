import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { subscriptionManageLink } from "@/lib/billing/paystack";

/** Paystack's hosted page where a card subscriber can change their card or cancel renewal. */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    const { data } = await supabase
      .from("subscriptions")
      .select("provider,provider_subscription_id,payment_method")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (data?.provider !== "paystack" || !data.provider_subscription_id) {
      return NextResponse.json({
        error: data?.payment_method === "mpesa"
          ? "M-Pesa plans don't renew automatically, so there is nothing to manage. Pay again before your plan ends to continue."
          : "Card management becomes available once your card subscription is active.",
      }, { status: 400 });
    }
    return NextResponse.json({ url: await subscriptionManageLink(data.provider_subscription_id) });
  } catch (error) {
    console.error("BILLING PORTAL ERROR:", error);
    return NextResponse.json({ error: "Unable to open card management right now. Please try again shortly." }, { status: 502 });
  }
}
