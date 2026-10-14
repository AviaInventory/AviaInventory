"use client";

import { useState } from "react";
import { Check, Minus } from "lucide-react";
import PlanCards from "./PlanCards";
import {
  allowedPaidPlans,
  formatUsd,
  type AccountBillingType,
  type BillingInterval,
  type PlanCode,
} from "@/lib/billing/plans";

const COMPARED_PLANS = [...allowedPaidPlans("buyer"), ...allowedPaidPlans("hybrid")];

// Capability matrix, in COMPARED_PLANS order: Buyer Basic, Hybrid Basic, Bronze, Platinum.
const ROWS: [string, boolean, boolean, boolean, boolean][] = [
  ["Marketplace", true, true, true, true],
  ["Buyer functionality", true, true, true, true],
  ["RFQs / quotes / orders", true, true, true, true],
  ["Supplier workspace", false, true, true, true],
  ["Inventory & listings", false, true, true, true],
  ["Supplier verification", false, true, true, true],
  ["Featured listings", false, false, true, true],
  ["Promotions", false, false, true, true],
  ["Priority search placement", false, false, true, true],
  ["Aviation Market Intelligence", false, false, false, true],
  ["Newsletter promotion", false, false, false, true],
  ["WhatsApp promotion", false, false, false, true],
  ["External advertising", false, false, false, true],
];

const COLUMN_TITLES: Record<string, string> = {
  buyer_basic: "Buyer Basic",
  hybrid_basic: "Hybrid Basic",
  hybrid_bronze: "Bronze",
  hybrid_platinum: "Platinum",
};

/** Plan cards and the comparison table, sharing one monthly/annual choice. */
export default function PricingPlans({
  accountType,
  currentPlanCode,
}: {
  accountType: AccountBillingType | null;
  currentPlanCode: PlanCode | null;
}) {
  const [interval, setInterval] = useState<BillingInterval>("month");

  return (
    <>
      <div className="mt-8">
        <PlanCards accountType={accountType} currentPlanCode={currentPlanCode} interval={interval} onIntervalChange={setInterval} />
      </div>

      <section className="mt-12 overflow-hidden rounded-2xl border border-aviation-border bg-white shadow-sm">
        <div className="border-b border-aviation-border p-5 sm:p-6">
          <h2 className="text-xl font-bold text-aviation-dark">Plan comparison</h2>
          <p className="mt-1 text-sm text-[var(--aviation-muted)]">
            Prices shown {interval === "month" ? "per month, billed monthly" : "per year, billed annually"}. Buyer-only plans do not include the
            supplier workspace or premium supplier marketing services.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-aviation-light">
              <tr>
                <th className="px-5 py-4 font-semibold">Capability</th>
                {COMPARED_PLANS.map((plan) => (
                  <th key={plan.code} className="px-5 py-4">
                    {COLUMN_TITLES[plan.code]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-aviation-border">
              <tr className="bg-aviation-light/60">
                <td className="px-5 py-3.5 font-semibold text-aviation-dark">Price</td>
                {COMPARED_PLANS.map((plan) => {
                  const annualSaving = plan.monthlyUsdCents * 12 - plan.annualUsdCents;
                  return (
                    <td key={plan.code} className="px-5 py-3.5 tabular-nums">
                      <span className="font-bold text-aviation-dark">
                        {formatUsd(interval === "month" ? plan.monthlyUsdCents : plan.annualUsdCents, interval)}
                      </span>
                      {interval === "year" && annualSaving > 0 && (
                        <span className="mt-0.5 block text-xs font-semibold text-aviation-success">
                          Save {formatUsd(annualSaving)} a year
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
              {ROWS.map(([label, ...included]) => (
                <tr key={label}>
                  <td className="px-5 py-3.5 font-medium text-aviation-dark">{label}</td>
                  {included.map((yes, index) => (
                    <td key={`${label}-${index}`} className="px-5 py-3.5">
                      {yes ? (
                        <Check size={17} className="text-aviation-success" aria-label="Included" />
                      ) : (
                        <Minus size={17} className="text-[var(--aviation-muted)]" aria-label="Not included" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-5 text-xs leading-5 text-[var(--aviation-muted)]">
          Bronze and Platinum are available only to Buyer &amp; Supplier accounts. Premium marketing services are subject to
          AviaInventory review and actual service availability. Every plan starts with a 90-day free trial.
        </div>
      </section>
    </>
  );
}
