import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AccountType } from "@/types/auth";

export async function requireRole(
  allowedRoles: AccountType[]
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/login");
  }

  const roles = Array.isArray(profile.account_roles) && profile.account_roles.length
    ? profile.account_roles
    : [profile.account_type];

  if (!allowedRoles.some((role) => roles.includes(role))) {
    redirect("/");
  }

  return profile;
}