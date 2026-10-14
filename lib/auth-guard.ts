import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveRoles } from "@/lib/auth-redirect";
import type { AccountType } from "@/types/auth";

/**
 * Server-side role gate for layouts and pages. Signed-out users are normally caught
 * earlier by the proxy (which preserves ?next=); this is the authoritative check.
 */
export async function requireRole(allowedRoles: AccountType[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (error || !profile) redirect("/login");

  const roles = resolveRoles(profile);
  if (!allowedRoles.some((role) => roles.includes(role))) redirect("/");

  return profile;
}
