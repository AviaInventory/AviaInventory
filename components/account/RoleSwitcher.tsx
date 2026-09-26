"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightLeft, ShoppingCart, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function RoleSwitcher({ active }: { active: "buyer" | "supplier" }) {
  const [hybrid, setHybrid] = useState(false);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("account_roles, account_type").eq("id", user.id).maybeSingle();
      const roles = Array.isArray(data?.account_roles) && data.account_roles.length ? data.account_roles : [data?.account_type];
      if (mounted) setHybrid(roles.includes("buyer") && roles.includes("supplier"));
    });
    return () => { mounted = false; };
  }, []);
  if (!hybrid) return null;
  return (
    <div className="flex items-center gap-1 rounded-xl border border-aviation-border bg-aviation-light p-1" aria-label="Workspace switcher">
      <Link
        href="/buyer/dashboard"
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${active === "buyer" ? "bg-white text-aviation-primary shadow-sm" : "text-aviation-muted hover:text-aviation-dark"}`}
        aria-current={active === "buyer" ? "page" : undefined}
      >
        <ShoppingCart size={15} /> Buying
      </Link>
      <ArrowRightLeft size={14} className="text-aviation-muted" aria-hidden="true" />
      <Link
        href="/supplier/dashboard"
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${active === "supplier" ? "bg-white text-aviation-primary shadow-sm" : "text-aviation-muted hover:text-aviation-dark"}`}
        aria-current={active === "supplier" ? "page" : undefined}
      >
        <Store size={15} /> Selling
      </Link>
    </div>
  );
}
