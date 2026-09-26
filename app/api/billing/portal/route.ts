import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBillingPortalSession } from "@/lib/billing/stripe";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    const { data } = await supabase.from("subscriptions").select("provider_customer_id").eq("user_id", user.id).not("provider_customer_id", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!data?.provider_customer_id) return NextResponse.json({ error: "Billing management becomes available after the first paid subscription is activated." }, { status: 400 });
    const session = await createBillingPortalSession(data.provider_customer_id);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("BILLING PORTAL ERROR:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to open billing management." }, { status: 500 });
  }
}
