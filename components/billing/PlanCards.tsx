"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Loader2, LockKeyhole, Smartphone } from "lucide-react";
import {
  ENTITLEMENT_LABELS,
  allowedPaidPlans,
  formatUsd,
  type AccountBillingType,
  type BillingInterval,
  type PlanCode,
  type PlanDefinition,
} from "@/lib/billing/plans";

type Props = {
  /**
   * The viewer's account type. Every plan is always shown so customers can compare;
   * only the plans for this account type can be bought. null = signed-out visitor,
   * who is sent to registration instead.
   */
  accountType: AccountBillingType | null;
  currentPlanCode?: PlanCode | null;
  /** Let the current plan be paid again (M-Pesa renewal, or a card that no longer renews). */
  allowRenewCurrent?: boolean;
  showTrial?: boolean;
  /** Controlled billing interval, e.g. shared with the comparison table. Uncontrolled when omitted. */
  interval?: BillingInterval;
  onIntervalChange?: (interval: BillingInterval) => void;
};

const GROUP_LABEL: Record<AccountBillingType, string> = { buyer: "BUYER", hybrid: "BUYER + SUPPLIER" };

type PaymentMethod = "card" | "mpesa";
type KesPrices = Record<string, { month: number; year: number }>;

const METHODS: { value: PaymentMethod; label: string; hint: string; Icon: typeof CreditCard }[] = [
  { value: "card", label: "Card", hint: "Renews automatically", Icon: CreditCard },
  { value: "mpesa", label: "M-Pesa", hint: "Pay each period", Icon: Smartphone },
];

function shortName(plan: PlanDefinition) {
  return plan.name.split(" — ")[0];
}

export default function PlanCards({ accountType, currentPlanCode, allowRenewCurrent = false, showTrial = true, interval: controlledInterval, onIntervalChange }: Props) {
  const router = useRouter();
  const [localInterval, setLocalInterval] = useState<BillingInterval>("month");
  const interval = controlledInterval ?? localInterval;
  const setInterval = onIntervalChange ?? setLocalInterval;
  const [method, setMethod] = useState<PaymentMethod>("card");
  // KES amounts charged at checkout (Paystack charges in KES), shown under the USD price.
  const [kesPrices, setKesPrices] = useState<KesPrices | null>(null);
  const [loading, setLoading] = useState<PlanCode | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/billing/prices")
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => { if (active && body?.prices) setKesPrices(body.prices as KesPrices); })
      .catch(() => { /* the USD price still shows */ });
    return () => { active = false; };
  }, []);
  const [error, setError] = useState("");
  // Buyer & Supplier account confirming "Disable selling" to switch to Buyer Basic.
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [disabling, setDisabling] = useState(false);

  async function disableSelling() {
    setError("");
    setDisabling(true);
    try {
      const response = await fetch("/api/account/downgrade-buyer", { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "We couldn't disable selling.");
      setConfirmDisable(false);
      // The page re-renders as a Buyer account, so Buyer Basic becomes selectable.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't disable selling.");
    } finally {
      setDisabling(false);
    }
  }

  const plans = [...allowedPaidPlans("buyer"), ...allowedPaidPlans("hybrid")];

  async function checkout(planCode: PlanCode) {
    setError("");
    setLoading(planCode);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planCode, interval, method }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Unable to start checkout.");
      if (body.accessCode) {
        // Paystack's pop-up opens over this page: the customer never leaves AviaInventory.
        const { default: PaystackPop } = await import("@paystack/inline-js");
        new PaystackPop().resumeTransaction(body.accessCode, {
          onLoad: () => setLoading(null),
          // The subscription page confirms the payment with Paystack on the server.
          onSuccess: (transaction) => window.location.assign(`/account/subscription?checkout=paystack&reference=${encodeURIComponent(transaction.reference)}`),
          onCancel: () => { setLoading(null); setError("Payment cancelled. You can try again whenever you're ready."); },
          onError: (popupError) => { setLoading(null); setError(popupError?.message || "The payment window could not open. Please try again."); },
        });
        return;
      }
      if (!body.url) throw new Error("The secure checkout URL was not returned.");
      window.location.assign(body.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-aviation-border bg-white p-3">
        <div>
          <p className="text-sm font-bold text-aviation-dark">Billing interval</p>
          <p className="text-xs text-aviation-muted">Prices are shown in USD and charged in Kenyan shillings (KES).</p>
        </div>
        <div className="flex rounded-lg border border-aviation-border bg-aviation-light p-1" role="group" aria-label="Billing interval">
          {(["month", "year"] as BillingInterval[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={interval === value}
              onClick={() => setInterval(value)}
              className={`min-h-11 rounded-md px-4 text-sm font-semibold ${interval === value ? "bg-white text-aviation-primary shadow-sm" : "text-aviation-muted"}`}
            >
              {value === "month" ? "Monthly" : "Annual"}
            </button>
          ))}
        </div>
      </div>

      {accountType !== null && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-aviation-border bg-white p-3">
          <div>
            <p className="text-sm font-bold text-aviation-dark">Payment method</p>
            <p className="text-xs text-aviation-muted">
              {method === "card"
                ? "Your card is charged now and on each renewal. Cancel any time."
                : "Pay with M-Pesa for one period at a time. We'll remind you before it ends."}
            </p>
          </div>
          <div className="flex flex-wrap rounded-lg border border-aviation-border bg-aviation-light p-1" role="group" aria-label="Payment method">
            {METHODS.map(({ value, label, hint, Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={method === value}
                onClick={() => setMethod(value)}
                className={`flex min-h-11 items-center gap-2 rounded-md px-4 text-left text-sm font-semibold ${method === value ? "bg-white text-aviation-primary shadow-sm" : "text-aviation-muted"}`}
              >
                <Icon size={16} aria-hidden="true" />
                <span>
                  <span className="block">{label}</span>
                  <span className="block text-[11px] font-normal">{hint}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl bg-aviation-error-soft p-4 text-sm text-aviation-error">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const price = interval === "month" ? plan.monthlyUsdCents : plan.annualUsdCents;
          const current = currentPlanCode === plan.code;
          const locked = current && !allowRenewCurrent;
          return (
            <article
              key={plan.code}
              className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ${plan.code === "hybrid_platinum" ? "border-aviation-primary" : "border-aviation-border"}`}
            >
              {plan.code === "hybrid_platinum" && (
                <span className="absolute right-4 top-4 rounded-full bg-aviation-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Platinum</span>
              )}
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-aviation-accent">{GROUP_LABEL[plan.accountType]}</p>
              <h2 className="mt-2 text-xl font-bold text-aviation-dark">{shortName(plan)}</h2>
              <div className="mt-4 text-2xl font-bold text-aviation-dark">{formatUsd(price, interval)}</div>
              <p className="mt-1 text-xs text-aviation-muted">
                {kesPrices?.[plan.code] ? `Charged as KES ${kesPrices[plan.code][interval].toLocaleString("en-KE")} · ` : ""}
                {interval === "year" ? "Billed annually" : "Billed monthly"}
              </p>
              <div className="mt-5 flex-1 space-y-2 border-t border-aviation-border pt-5">
                {plan.entitlements.map((entitlement) => (
                  <div key={entitlement} className="flex gap-2 text-sm">
                    <Check size={16} className="mt-0.5 shrink-0 text-aviation-success" />
                    <span>{ENTITLEMENT_LABELS[entitlement] ?? entitlement}</span>
                  </div>
                ))}
              </div>

              {accountType === null ? (
                <Link
                  href={plan.accountType === "hybrid" ? "/register?type=supplier" : "/register?type=buyer"}
                  className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-aviation-primary px-4 py-3 text-sm font-bold text-white"
                >
                  Start 90-day free trial
                </Link>
              ) : plan.accountType !== accountType ? (
                accountType === "buyer" ? (
                  <Link
                    href="/account/profile?next=/pricing#enable-selling"
                    className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-aviation-primary px-4 py-3 text-center text-sm font-bold text-aviation-primary"
                  >
                    Enable selling to choose this plan
                  </Link>
                ) : confirmDisable ? (
                  <div className="mt-6 space-y-3 rounded-xl border border-aviation-border bg-aviation-light p-4 text-sm">
                    <p className="text-aviation-dark">
                      Disable selling? Your listings, quotes and documents are kept, and you can enable selling again at any time.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={disableSelling}
                        disabled={disabling}
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-aviation-primary px-3 py-2 font-semibold text-white disabled:opacity-60"
                      >
                        {disabling && <Loader2 size={16} className="animate-spin" />}
                        {disabling ? "Disabling…" : "Disable selling"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDisable(false)}
                        disabled={disabling}
                        className="min-h-11 rounded-xl border border-aviation-border bg-white px-3 py-2 font-semibold text-aviation-dark"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDisable(true)}
                    className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-aviation-primary px-4 py-3 text-center text-sm font-bold text-aviation-primary"
                  >
                    Disable selling to choose this plan
                  </button>
                )
              ) : (
                <button
                  type="button"
                  disabled={locked || loading !== null}
                  onClick={() => checkout(plan.code)}
                  className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-aviation-primary px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading === plan.code ? <Loader2 size={16} className="animate-spin" /> : locked ? <LockKeyhole size={16} /> : null}
                  {locked
                    ? "Current plan"
                    : loading === plan.code
                      ? "Opening secure checkout…"
                      : `${current ? "Renew" : method === "mpesa" ? "Pay with M-Pesa" : "Pay by card"}: ${shortName(plan)}${current ? (method === "mpesa" ? " with M-Pesa" : " by card") : ""}`}
                </button>
              )}
            </article>
          );
        })}
      </div>

      {showTrial && (
        <div className="rounded-xl border border-aviation-border bg-aviation-light p-4 text-sm text-aviation-muted">
          <strong className="text-aviation-dark">90-day Free Trial:</strong> New Buyer and Buyer & Supplier accounts receive trial access before paid billing is required. No automatic charge is made when the trial ends.
        </div>
      )}
    </div>
  );
}
