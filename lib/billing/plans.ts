export type AccountBillingType = "buyer" | "hybrid";
export type PlanCode = "buyer_trial" | "buyer_basic" | "hybrid_trial" | "hybrid_basic" | "hybrid_bronze" | "hybrid_platinum";
export type BillingInterval = "month" | "year";

export type PlanDefinition = {
  code: PlanCode;
  name: string;
  accountType: AccountBillingType;
  monthlyUsdCents: number;
  annualUsdCents: number;
  trialDays: number;
  entitlements: string[];
};

export const PLAN_DEFINITIONS: Record<PlanCode, PlanDefinition> = {
  buyer_trial: {
    code: "buyer_trial", name: "Free Trial", accountType: "buyer", monthlyUsdCents: 0, annualUsdCents: 0, trialDays: 90,
    entitlements: ["marketplace", "buyer_features"],
  },
  buyer_basic: {
    code: "buyer_basic", name: "Basic — Buyer", accountType: "buyer", monthlyUsdCents: 1200, annualUsdCents: 10000, trialDays: 0,
    entitlements: ["marketplace", "buyer_features"],
  },
  hybrid_trial: {
    code: "hybrid_trial", name: "Free Trial", accountType: "hybrid", monthlyUsdCents: 0, annualUsdCents: 0, trialDays: 90,
    entitlements: ["marketplace", "buyer_features", "supplier_features"],
  },
  hybrid_basic: {
    code: "hybrid_basic", name: "Basic — Buyer & Supplier", accountType: "hybrid", monthlyUsdCents: 2500, annualUsdCents: 20000, trialDays: 0,
    entitlements: ["marketplace", "buyer_features", "supplier_features"],
  },
  hybrid_bronze: {
    code: "hybrid_bronze", name: "Bronze — Buyer & Supplier", accountType: "hybrid", monthlyUsdCents: 4800, annualUsdCents: 55000, trialDays: 0,
    entitlements: ["marketplace", "buyer_features", "supplier_features", "featured_listings", "promotions", "priority_search"],
  },
  hybrid_platinum: {
    code: "hybrid_platinum", name: "Platinum — Buyer & Supplier", accountType: "hybrid", monthlyUsdCents: 9500, annualUsdCents: 100000, trialDays: 0,
    entitlements: ["marketplace", "buyer_features", "supplier_features", "featured_listings", "promotions", "priority_search", "aviation_intelligence", "newsletter_promotion", "whatsapp_promotion", "external_advertising"],
  },
};

export const PLAN_ORDER: PlanCode[] = ["buyer_trial", "buyer_basic", "hybrid_trial", "hybrid_basic", "hybrid_bronze", "hybrid_platinum"];

export function getPlan(code: string | null | undefined): PlanDefinition | null {
  if (!code) return null;
  return PLAN_DEFINITIONS[code as PlanCode] ?? null;
}

export function accountBillingType(roles: string[] | null | undefined): AccountBillingType {
  return roles?.includes("supplier") ? "hybrid" : "buyer";
}

export function allowedPaidPlans(accountType: AccountBillingType): PlanDefinition[] {
  return accountType === "hybrid"
    ? [PLAN_DEFINITIONS.hybrid_basic, PLAN_DEFINITIONS.hybrid_bronze, PLAN_DEFINITIONS.hybrid_platinum]
    : [PLAN_DEFINITIONS.buyer_basic];
}

export function isPlanAllowed(accountType: AccountBillingType, planCode: PlanCode): boolean {
  if (planCode === "buyer_trial" || planCode === "hybrid_trial") return false;
  return allowedPaidPlans(accountType).some((plan) => plan.code === planCode);
}

export function formatUsd(cents: number, interval?: BillingInterval): string {
  const amount = (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `USD ${amount}${interval === "month" ? "/month" : interval === "year" ? "/year" : ""}`;
}

export const ENTITLEMENT_LABELS: Record<string, string> = {
  marketplace: "Marketplace access",
  buyer_features: "Buyer functionality",
  supplier_features: "Supplier workspace",
  featured_listings: "Featured listings",
  promotions: "Promotions",
  priority_search: "Priority search placement",
  aviation_intelligence: "Aviation Market Intelligence",
  newsletter_promotion: "Newsletter promotion eligibility",
  whatsapp_promotion: "WhatsApp promotion eligibility",
  external_advertising: "External advertising eligibility",
};
