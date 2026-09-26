import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSubscriptionAccess } from "@/lib/billing/entitlements";

export async function getAdminSubscriptionSnapshot() {
  const supabase = createAdminClient();
  const [{ data: subscriptions }, { data: profiles }, { data: events }] = await Promise.all([
    supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("profiles").select("id,company_name,email,account_type,account_roles").limit(500),
    supabase.from("billing_events").select("id,event_type,status,created_at,processed_at,error_message").order("created_at", { ascending: false }).limit(50),
  ]);
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return (subscriptions ?? []).map((row) => ({ ...buildSubscriptionAccess(row as Record<string, unknown>), profile: profileMap.get(row.user_id) ?? null })).filter(Boolean);
}
