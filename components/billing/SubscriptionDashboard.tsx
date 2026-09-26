"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import type { SubscriptionAccess } from "@/lib/billing/entitlements";
import { ENTITLEMENT_LABELS, PLAN_DEFINITIONS, formatUsd } from "@/lib/billing/plans";
import PlanCards from "@/components/billing/PlanCards";

export default function SubscriptionDashboard({ subscription, accountType, hasBillingPortal, invoices }: { subscription: SubscriptionAccess | null; accountType: "buyer" | "hybrid"; hasBillingPortal: boolean; invoices: Array<{ id:string; status:string; amount_due_cents:number; amount_paid_cents:number; currency:string; hosted_invoice_url:string|null; invoice_pdf_url:string|null; created_at:string; paid_at:string|null }> }) {
  const [portalLoading, setPortalLoading] = useState(false);
  const expired = !subscription?.effectiveActive || subscription.effectiveStatus === "trial_expired" || subscription.effectiveStatus === "expired";
  const daysRemaining = subscription?.trialEndsAt ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / 86_400_000)) : null;
  const currentPlan = subscription ? PLAN_DEFINITIONS[subscription.planCode] : null;

  async function openPortal() {
    setPortalLoading(true);
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Unable to open billing management.");
      window.location.assign(body.url);
    } catch (error) { window.alert(error instanceof Error ? error.message : "Unable to open billing management."); }
    finally { setPortalLoading(false); }
  }

  return <div className="space-y-6">
    {expired && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6"><div className="flex gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={20}/><div><h1 className="font-bold text-amber-950">Choose a plan to continue using AviaInventory</h1><p className="mt-1 text-sm leading-6 text-amber-900">Your free trial has ended. Your company data remains intact and no payment was taken automatically. Choose a paid plan below.</p></div></div></section>}
    {!expired && subscription?.status === "past_due" && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={20}/><div><h1 className="font-bold text-amber-950">Payment issue</h1><p className="mt-1 text-sm text-amber-900">Your latest subscription payment could not be completed. Update billing before the grace period ends.</p></div></div></section>}

    <section className="rounded-2xl border border-aviation-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-aviation-accent">CURRENT PLAN</p><h2 className="mt-1 text-2xl font-bold text-aviation-dark">{subscription?.planName ?? "No active subscription"}</h2><p className="mt-1 text-sm text-aviation-muted">{subscription?.status === "trialing" && daysRemaining !== null ? `${daysRemaining} days remaining` : subscription?.billingInterval && currentPlan ? formatUsd(subscription.billingInterval === "month" ? currentPlan.monthlyUsdCents : currentPlan.annualUsdCents, subscription.billingInterval) : "Select a paid plan to activate billing."}</p></div>{hasBillingPortal && <button type="button" onClick={openPortal} disabled={portalLoading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-aviation-border px-4 py-2.5 text-sm font-semibold text-aviation-dark">{portalLoading?<Loader2 size={16} className="animate-spin"/>:<ExternalLink size={16}/>} Manage billing</button>}</div>
      {subscription?.trialEndsAt && <div className="mt-5 rounded-xl bg-aviation-light p-4 text-sm"><p className="font-semibold text-aviation-dark">Free Trial</p><p className="mt-1 text-aviation-muted">Trial ends {new Date(subscription.trialEndsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. No automatic charge occurs at trial expiry.</p></div>}
      {subscription?.effectiveActive && <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-aviation-border p-4"><p className="text-xs uppercase tracking-wider text-aviation-muted">Status</p><p className="mt-1 font-semibold capitalize">{subscription.effectiveStatus.replaceAll("_", " ")}</p></div><div className="rounded-xl border border-aviation-border p-4"><p className="text-xs uppercase tracking-wider text-aviation-muted">Next billing date</p><p className="mt-1 font-semibold">{subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB") : "—"}</p></div></div>}
    </section>

    {!expired && subscription?.effectiveActive && <section className="rounded-2xl border border-aviation-border bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-aviation-dark">Enabled capabilities</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{subscription.entitlements.map((item) => <div key={item} className="flex gap-2 rounded-xl bg-aviation-light p-3 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-aviation-success"/>{ENTITLEMENT_LABELS[item] ?? item}</div>)}</div></section>}
    <section className="rounded-2xl border border-aviation-border bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-aviation-dark">Billing history</h2><p className="mt-1 text-sm text-aviation-muted">Invoices and receipts appear here when the payment provider supplies them.</p><div className="mt-4 overflow-x-auto">{invoices.length ? <table className="min-w-[620px] w-full text-left text-sm"><thead><tr className="border-b border-aviation-border text-xs text-aviation-muted"><th className="pb-3">Date</th><th className="pb-3">Amount</th><th className="pb-3">Status</th><th className="pb-3">Document</th></tr></thead><tbody className="divide-y divide-aviation-border">{invoices.map((invoice)=><tr key={invoice.id}><td className="py-3">{new Date(invoice.created_at).toLocaleDateString("en-GB")}</td><td className="py-3 font-semibold">{invoice.currency.toUpperCase()} {(Number(invoice.amount_paid_cents||invoice.amount_due_cents)/100).toFixed(2)}</td><td className="py-3 capitalize">{invoice.status.replaceAll("_"," ")}</td><td className="py-3">{invoice.invoice_pdf_url?<a className="font-semibold text-aviation-primary" href={invoice.invoice_pdf_url} target="_blank" rel="noreferrer">PDF</a>:invoice.hosted_invoice_url?<a className="font-semibold text-aviation-primary" href={invoice.hosted_invoice_url} target="_blank" rel="noreferrer">Invoice</a>:"—"}</td></tr>)}</tbody></table> : <div className="rounded-xl bg-aviation-light p-4 text-sm text-aviation-muted">No invoices have been issued yet.</div>}</div></section>

    <section><div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-aviation-accent">PLAN SELECTION</p><h2 className="mt-1 text-xl font-bold text-aviation-dark">{expired ? "Select your paid plan" : "Change plan"}</h2></div>{!expired && <Link href="/pricing" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-aviation-primary">Compare all plans <ArrowRight size={15}/></Link>}</div><PlanCards accountType={accountType} currentPlanCode={subscription?.planCode ?? null} showTrial={false}/></section>
  </div>;
}
