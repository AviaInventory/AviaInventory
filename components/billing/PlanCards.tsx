"use client";

import { Check, Loader2, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { ENTITLEMENT_LABELS, PLAN_DEFINITIONS, formatUsd, type BillingInterval, type PlanCode } from "@/lib/billing/plans";

export default function PlanCards({ accountType, currentPlanCode, showTrial = true }: { accountType: "buyer" | "hybrid"; currentPlanCode?: PlanCode | null; showTrial?: boolean }) {
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [loading, setLoading] = useState<PlanCode | null>(null);
  const plans = accountType === "hybrid"
    ? [PLAN_DEFINITIONS.hybrid_basic, PLAN_DEFINITIONS.hybrid_bronze, PLAN_DEFINITIONS.hybrid_platinum]
    : [PLAN_DEFINITIONS.buyer_basic];

  async function checkout(planCode: PlanCode) {
    setLoading(planCode);
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ planCode, interval }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Unable to start checkout.");
      if (body.changed) { window.location.assign("/account/subscription?changed=success"); return; }
      if (!body.url) throw new Error("The secure checkout URL was not returned.");
      window.location.assign(body.url);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to start checkout.");
    } finally { setLoading(null); }
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-aviation-border bg-white p-3">
      <div><p className="text-sm font-bold text-aviation-dark">Billing interval</p><p className="text-xs text-aviation-muted">Choose monthly or annual billing. Prices are in USD.</p></div>
      <div className="flex rounded-lg border border-aviation-border bg-aviation-light p-1" role="group" aria-label="Billing interval">
        {(["month", "year"] as BillingInterval[]).map((value) => <button key={value} type="button" onClick={() => setInterval(value)} className={`min-h-11 rounded-md px-4 text-sm font-semibold ${interval === value ? "bg-white text-aviation-primary shadow-sm" : "text-aviation-muted"}`}>{value === "month" ? "Monthly" : "Annual"}</button>)}
      </div>
    </div>
    <div className={`grid gap-5 ${plans.length === 1 ? "max-w-xl" : "lg:grid-cols-3"}`}>
      {plans.map((plan) => {
        const price = interval === "month" ? plan.monthlyUsdCents : plan.annualUsdCents;
        const current = currentPlanCode === plan.code;
        return <article key={plan.code} className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ${plan.code === "hybrid_platinum" ? "border-aviation-primary" : "border-aviation-border"}`}>
          {plan.code === "hybrid_platinum" && <span className="absolute right-4 top-4 rounded-full bg-aviation-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Platinum</span>}
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-aviation-accent">{accountType === "hybrid" ? "BUYER + SUPPLIER" : "BUYER"}</p>
          <h2 className="mt-2 text-xl font-bold text-aviation-dark">{plan.name.replace(" — Buyer & Supplier", "").replace(" — Buyer", "")}</h2>
          <div className="mt-4 text-2xl font-bold text-aviation-dark">{formatUsd(price, interval)}</div>
          <p className="mt-1 text-xs text-aviation-muted">{interval === "year" ? "Billed annually" : "Billed monthly"}</p>
          <div className="mt-5 space-y-2 border-t border-aviation-border pt-5">{plan.entitlements.map((entitlement) => <div key={entitlement} className="flex gap-2 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-aviation-success"/><span>{ENTITLEMENT_LABELS[entitlement] ?? entitlement}</span></div>)}</div>
          <button type="button" disabled={current || loading !== null} onClick={() => checkout(plan.code)} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-aviation-primary px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{loading === plan.code ? <Loader2 size={16} className="animate-spin"/> : current ? <LockKeyhole size={16}/> : null}{current ? "Current plan" : loading === plan.code ? "Opening secure checkout…" : `Choose ${plan.name.split(" — ")[0]}`}</button>
        </article>;
      })}
    </div>
    {showTrial && <div className="rounded-xl border border-aviation-border bg-aviation-light p-4 text-sm text-aviation-muted"><strong className="text-aviation-dark">90-day Free Trial:</strong> New Buyer and Buyer & Supplier accounts receive trial access before paid billing is required. No automatic charge is made when the trial ends.</div>}
  </div>;
}
