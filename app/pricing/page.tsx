import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PlanCards from "@/components/billing/PlanCards";

export const metadata: Metadata = {
  title: "AviaInventory Pricing | Aviation Marketplace Plans",
  description: "Compare AviaInventory Buyer and Buyer & Supplier subscription plans, including the 90-day free trial and premium marketplace visibility services.",
  openGraph: { title: "AviaInventory Pricing", description: "Subscription plans for aviation procurement and supplier operations." },
};

const rows: [string, boolean, boolean, boolean, boolean][] = [
  ["Marketplace", true, true, true, true], ["Buyer functionality", true, true, true, true], ["RFQs / quotes / orders", true, true, true, true],
  ["Supplier workspace", false, true, true, true], ["Inventory & listings", false, true, true, true], ["Supplier verification", false, true, true, true],
  ["Featured listings", false, false, true, true], ["Promotions", false, false, true, true], ["Priority search placement", false, false, true, true],
  ["Aviation Market Intelligence", false, false, false, true], ["Newsletter promotion", false, false, false, true], ["WhatsApp promotion", false, false, false, true], ["External advertising", false, false, false, true],
];

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let accountType: "buyer" | "hybrid" = "buyer";
  let currentPlanCode: "buyer_trial" | "buyer_basic" | "hybrid_trial" | "hybrid_basic" | "hybrid_bronze" | "hybrid_platinum" | null = null;
  if (user) {
    const [{ data: profile }, { data: subscription }] = await Promise.all([
      supabase.from("profiles").select("account_type,account_roles").eq("id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("plan_code").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const roles = Array.isArray(profile?.account_roles) && profile.account_roles.length ? profile.account_roles : [profile?.account_type];
    accountType = roles.includes("supplier") ? "hybrid" : "buyer";
    currentPlanCode = subscription?.plan_code ?? null;
  }
  return <main className="min-h-screen bg-aviation-light"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
    <div className="max-w-3xl"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-aviation-accent">AVIAINVENTORY COMMERCIAL PLANS</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-aviation-dark sm:text-5xl">Choose the service level that matches your aviation operation.</h1><p className="mt-4 text-base leading-7 text-aviation-muted">Start with a 90-day free trial. Buyer accounts can add selling capability at any time through the same company account.</p></div>
    <div className="mt-8"><PlanCards accountType={accountType} currentPlanCode={currentPlanCode}/></div>
    <section className="mt-12 overflow-hidden rounded-2xl border border-aviation-border bg-white shadow-sm"><div className="border-b border-aviation-border p-5 sm:p-6"><h2 className="text-xl font-bold text-aviation-dark">Plan comparison</h2><p className="mt-1 text-sm text-aviation-muted">Buyer-only plans do not include supplier workspace or premium supplier marketing services.</p></div><div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-aviation-light"><tr><th className="px-5 py-4 font-semibold">Capability</th><th className="px-5 py-4">Buyer Basic</th><th className="px-5 py-4">Hybrid Basic</th><th className="px-5 py-4">Bronze</th><th className="px-5 py-4">Platinum</th></tr></thead><tbody className="divide-y divide-aviation-border">{rows.map(([label,...values])=><tr key={label}><td className="px-5 py-3.5 font-medium text-aviation-dark">{label}</td>{values.map((included,index)=><td key={`${label}-${index}`} className="px-5 py-3.5">{included?<Check size={17} className="text-aviation-success" aria-label="Included"/>:<Minus size={17} className="text-aviation-muted" aria-label="Not included"/>}</td>)}</tr>)}</tbody></table></div><div className="p-5 text-xs leading-5 text-aviation-muted">Bronze and Platinum are available only to Buyer & Supplier Hybrid accounts. Premium marketing services are subject to AviaInventory review and actual service availability.</div></section>
    {!user && <div className="mt-6 text-sm text-aviation-muted">Already have an account? <Link href="/login" className="font-semibold text-aviation-primary">Sign in</Link> to choose a paid plan.</div>}
  </div></main>;
}
