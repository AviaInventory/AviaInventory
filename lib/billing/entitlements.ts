import "server-only";
import { getPlan, type PlanCode } from "@/lib/billing/plans";

export type SubscriptionAccess = {
  id: string;
  userId: string;
  accountType: "buyer" | "hybrid";
  planCode: PlanCode;
  planName: string;
  status: string;
  billingInterval: "month" | "year" | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  entitlements: string[];
  effectiveActive: boolean;
  effectiveStatus: "trialing" | "active" | "past_due" | "trial_expired" | "expired" | "cancelled" | "incomplete" | "payment_failed";
};

export function buildSubscriptionAccess(row: Record<string, unknown>): SubscriptionAccess | null {
  const plan = getPlan(String(row.plan_code ?? ""));
  if (!plan) return null;
  const now = Date.now();
  const trialEnds = row.trial_ends_at ? new Date(String(row.trial_ends_at)).getTime() : null;
  const periodEnd = row.current_period_end ? new Date(String(row.current_period_end)).getTime() : null;
  const status = String(row.status ?? "expired");
  const trialExpired = status === "trialing" && trialEnds !== null && trialEnds <= now;
  const graceDays = Number(process.env.BILLING_GRACE_PERIOD_DAYS ?? "7");
  const graceEnd = status === "past_due" && periodEnd !== null ? periodEnd + graceDays * 86_400_000 : null;
  const active = status === "active"
    || (status === "trialing" && !trialExpired)
    || (status === "past_due" && graceEnd !== null && graceEnd > now);

  let effectiveStatus: SubscriptionAccess["effectiveStatus"] = status as SubscriptionAccess["effectiveStatus"];
  if (trialExpired) effectiveStatus = "trial_expired";
  if (!active && status === "active") effectiveStatus = "expired";

  return {
    id: String(row.id),
    userId: String(row.user_id),
    accountType: String(row.account_type) === "hybrid" ? "hybrid" : "buyer",
    planCode: plan.code,
    planName: plan.name,
    status,
    billingInterval: row.billing_interval === "month" || row.billing_interval === "year" ? row.billing_interval : null,
    trialStartedAt: row.trial_started_at ? String(row.trial_started_at) : null,
    trialEndsAt: row.trial_ends_at ? String(row.trial_ends_at) : null,
    currentPeriodStart: row.current_period_start ? String(row.current_period_start) : null,
    currentPeriodEnd: row.current_period_end ? String(row.current_period_end) : null,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    cancelledAt: row.cancelled_at ? String(row.cancelled_at) : null,
    entitlements: plan.entitlements,
    effectiveActive: active,
    effectiveStatus,
  };
}

export function hasEntitlement(subscription: SubscriptionAccess | null, entitlement: string): boolean {
  return Boolean(subscription?.effectiveActive && subscription.entitlements.includes(entitlement));
}
