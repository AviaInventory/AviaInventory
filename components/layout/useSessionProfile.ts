"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { resolveRoles, type AccountRole } from "@/lib/auth-redirect";

export type SessionProfile = {
  email: string;
  name: string;
  company: string | null;
  roles: AccountRole[];
};

/**
 * The signed-in user's display details for site chrome, kept in sync with
 * sign-in / sign-out in any tab. `undefined` while loading, `null` when signed out.
 */
export function useSessionProfile(): SessionProfile | null | undefined {
  const [profile, setProfile] = useState<SessionProfile | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    async function load(userId: string | undefined, email: string | undefined) {
      if (!userId) {
        if (active) setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("full_name, company_name, account_type, account_roles")
        .eq("id", userId)
        .maybeSingle();
      if (!active) return;
      setProfile({
        email: email ?? "",
        name: data?.full_name || email || "My account",
        company: data?.company_name ?? null,
        roles: resolveRoles(data),
      });
    }

    supabase.auth.getUser().then(({ data: { user } }) => load(user?.id, user?.email));

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        load(session?.user.id, session?.user.email);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return profile;
}
