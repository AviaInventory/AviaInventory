import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PricingPlans from "@/components/billing/PricingPlans";
import { resolveRoles } from "@/lib/auth-redirect";
import { accountBillingType, type AccountBillingType, type PlanCode } from "@/lib/billing/plans";

export const metadata: Metadata = {
  title: "AviaInventory Pricing | Aviation Marketplace Plans",
  description: "Compare AviaInventory Buyer and Buyer & Supplier subscription plans, including the 90-day free trial and premium marketplace visibility services.",
  openGraph: { title: "AviaInventory Pricing", description: "Subscription plans for aviation procurement and supplier operations." },
};

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Signed-out visitors (accountType null) see every plan and are sent to registration.
  let accountType: AccountBillingType | null = null;
  let currentPlanCode: PlanCode | null = null;
  if (user) {
    const [{ data: profile }, { data: subscription }] = await Promise.all([
      supabase.from("profiles").select("account_type,account_roles").eq("id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("plan_code").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    accountType = accountBillingType(resolveRoles(profile));
    currentPlanCode = subscription?.plan_code ?? null;
  }
  return <main className="min-h-screen bg-aviation-light"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
    <div className="max-w-3xl"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-aviation-accent">AVIAINVENTORY COMMERCIAL PLANS</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-aviation-dark sm:text-5xl">Choose the service level that matches your aviation operation.</h1><p className="mt-4 text-base leading-7 text-aviation-muted">Start with a 90-day free trial. Buyer accounts can add selling capability at any time through the same company account.</p></div>
    <PricingPlans accountType={accountType} currentPlanCode={currentPlanCode} />
    {!user && <div className="mt-6 text-sm text-aviation-muted">Already have an account? <Link href="/login?next=/pricing" className="font-semibold text-aviation-primary">Sign in</Link> to choose a paid plan.</div>}
  </div></main>;
}
