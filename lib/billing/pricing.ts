import "server-only";
import { getPlan, type BillingInterval, type PlanCode } from "@/lib/billing/plans";

/**
 * What a plan costs at checkout. Plans are priced in USD; the Paystack account charges
 * in KES (M-Pesa only supports KES, and USD is not enabled on the merchant account).
 *
 * INTERIM: KES = USD × BILLING_USD_KES_RATE, rounded up to the nearest KES 50.
 * The long-term conversion policy (daily rate with a change threshold) is still being
 * decided; when it is, only this function needs to change.
 */
export type ChargeAmount = {
  currency: "KES";
  /** Paystack amounts are in the currency's subunit (cents). */
  amountMinor: number;
  /** Whole shillings, for display. */
  amount: number;
  usdCents: number;
  rate: number;
};

const ROUND_TO_KES = 50;

export function usdKesRate(): number {
  const rate = Number(process.env.BILLING_USD_KES_RATE);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Billing is not configured: set BILLING_USD_KES_RATE (for example 130).");
  }
  return rate;
}

export function chargeAmount(planCode: PlanCode, interval: BillingInterval): ChargeAmount {
  const plan = getPlan(planCode);
  if (!plan) throw new Error(`Unknown plan ${planCode}.`);
  const usdCents = interval === "year" ? plan.annualUsdCents : plan.monthlyUsdCents;
  if (usdCents <= 0) throw new Error(`${plan.name} is not a paid plan.`);
  const rate = usdKesRate();
  const amount = Math.ceil(((usdCents / 100) * rate) / ROUND_TO_KES) * ROUND_TO_KES;
  return { currency: "KES", amountMinor: amount * 100, amount, usdCents, rate };
}

export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}
