import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSubscription } from "@/lib/billing/subscription";
import { accountBillingType } from "@/lib/billing/plans";
import SubscriptionDashboard from "@/components/billing/SubscriptionDashboard";

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, subscription, { data: billingCustomer }, { data: invoices }] = await Promise.all([
    supabase.from("profiles").select("account_type,account_roles").eq("id", user.id).maybeSingle(),
    getCurrentSubscription(user.id),
    supabase.from("subscriptions").select("provider_customer_id").eq("user_id", user.id).not("provider_customer_id", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("billing_invoices").select("id,status,amount_due_cents,amount_paid_cents,currency,hosted_invoice_url,invoice_pdf_url,created_at,paid_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);
  const roles = Array.isArray(profile?.account_roles) && profile.account_roles.length ? profile.account_roles : [profile?.account_type];
  const accountType = accountBillingType(roles.filter(Boolean) as string[]);
  return <main className="min-h-[calc(100vh-72px)] bg-aviation-light"><div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-aviation-accent">ACCOUNT CENTRE · SUBSCRIPTION</p><h1 className="mt-1 text-2xl font-bold text-aviation-dark sm:text-3xl">Subscription & Billing</h1><p className="mt-1 text-sm text-aviation-muted">Account type determines what you do. Your subscription determines the service level you receive.</p></div><Link href="/account/profile" className="min-h-11 rounded-xl border border-aviation-border bg-white px-4 py-2.5 text-sm font-semibold">Back to Account Centre</Link></div><SubscriptionDashboard subscription={subscription} accountType={accountType} hasBillingPortal={Boolean(billingCustomer?.provider_customer_id)} invoices={invoices ?? []}/></div></main>;
}
