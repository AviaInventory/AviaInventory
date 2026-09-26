import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildSubscriptionAccess, hasEntitlement, type SubscriptionAccess } from "@/lib/billing/entitlements";
import { accountBillingType, allowedPaidPlans, type AccountBillingType, type PlanCode } from "@/lib/billing/plans";

export async function getCurrentSubscription(userId?: string): Promise<SubscriptionAccess | null> {
  const supabase = await createClient();
  const target = userId ?? (await supabase.auth.getUser()).data.user?.id;
  if (!target) return null;
  const { data } = await supabase.from("subscriptions").select("*").eq("user_id", target).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data ? buildSubscriptionAccess(data as Record<string, unknown>) : null;
}

export async function getCurrentAccountType(): Promise<AccountBillingType> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "buyer";
  const { data } = await supabase.from("profiles").select("account_roles,account_type").eq("id", user.id).maybeSingle();
  const roles = Array.isArray(data?.account_roles) && data.account_roles.length ? data.account_roles : [data?.account_type];
  return accountBillingType(roles.filter(Boolean) as string[]);
}

export async function requireActiveSubscription(entitlement?: string): Promise<SubscriptionAccess> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("account_type,account_roles").eq("id", user.id).maybeSingle();
  const roles = Array.isArray(profile?.account_roles) && profile.account_roles.length ? profile.account_roles : [profile?.account_type];
  if (roles.includes("admin")) {
    return {
      id: "admin-bypass", userId: user.id, accountType: "hybrid", planCode: "hybrid_platinum", planName: "Admin access", status: "active", billingInterval: null,
      trialStartedAt: null, trialEndsAt: null, currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false, cancelledAt: null,
      entitlements: ["marketplace", "buyer_features", "supplier_features", "featured_listings", "promotions", "priority_search", "aviation_intelligence", "newsletter_promotion", "whatsapp_promotion", "external_advertising"],
      effectiveActive: true, effectiveStatus: "active",
    };
  }
  const subscription = await getCurrentSubscription(user.id);
  if (!subscription?.effectiveActive || (entitlement && !hasEntitlement(subscription, entitlement))) redirect(`/account/subscription?required=${encodeURIComponent(entitlement ?? "subscription")}`);
  return subscription;
}

export function availablePlansForAccount(accountType: AccountBillingType) {
  return allowedPaidPlans(accountType);
}

export function canUsePlan(accountType: AccountBillingType, planCode: PlanCode): boolean {
  return allowedPaidPlans(accountType).some((plan) => plan.code === planCode);
}
