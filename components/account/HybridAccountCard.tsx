"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, Check, Loader2, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function HybridAccountCard({ activeRole }: { activeRole: "buyer" | "supplier" }) {
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("account_roles, account_type").eq("id", user.id).maybeSingle();
      if (!mounted) return;
      const nextRoles = Array.isArray(data?.account_roles) && data.account_roles.length
        ? data.account_roles
        : data?.account_type === "supplier" ? ["supplier"] : data?.account_type === "admin" ? ["admin"] : ["buyer"];
      setRoles(nextRoles);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const hybrid = roles.includes("buyer") && roles.includes("supplier");
  if (loading) return null;

  async function upgrade() {
    if (upgrading) return;
    setUpgrading(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/upgrade-hybrid", { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Unable to upgrade your account.");
      setRoles(["buyer", "supplier"]);
      setMessage("Buyer & Supplier access is enabled. You can now switch between Buying and Selling without signing in again.");
      setConfirmOpen(false);
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upgrade your account.");
    } finally {
      setUpgrading(false);
    }
  }

  if (hybrid) {
    return (
      <section className="rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-aviation-success-soft text-aviation-primary"><ArrowRightLeft size={21} /></span>
          <div><h2 className="font-semibold">Buyer & Supplier account</h2><p className="mt-1 text-sm text-aviation-muted">Buying and Selling are active on the same company account.</p></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-aviation-success-soft px-3 py-2 font-medium text-aviation-primary"><Check size={15} /> Buying enabled</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-aviation-success-soft px-3 py-2 font-medium text-aviation-primary"><Check size={15} /> Selling enabled</span>
        </div>
        <p className="mt-4 text-sm text-aviation-muted">Use the Buying / Selling switcher to move between procurement and supplier operations.</p>
      </section>
    );
  }

  if (!roles.includes(activeRole)) return null;

  return (
    <section className="rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-aviation-success-soft text-aviation-primary"><Store size={21} /></span>
        <div><h2 className="font-semibold">Enable both Buying & Selling</h2><p className="mt-1 text-sm text-aviation-muted">Upgrade this company account so the same login can buy parts and sell inventory.</p></div>
      </div>
      <button onClick={() => setConfirmOpen(true)} disabled={upgrading} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-aviation-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
        {upgrading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRightLeft size={16} />}
        {upgrading ? "Enabling hybrid access..." : "Upgrade to hybrid account"}
      </button>
      {message && <p className="mt-3 text-sm text-aviation-muted">{message}</p>}
      {confirmOpen && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-aviation-dark/50 p-4" role="dialog" aria-modal="true" aria-labelledby="upgrade-title"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><h3 id="upgrade-title" className="text-xl font-bold text-aviation-dark">Enable selling</h3><p className="mt-2 text-sm leading-6 text-aviation-muted">Your existing Buyer account will remain active. We’ll enable the Supplier profile, inventory, RFQs, quotations, verification and Selling workspace on this same company account.</p><div className="mt-5 rounded-xl bg-aviation-light p-4 text-sm"><p className="font-semibold text-aviation-dark">Nothing is duplicated</p><p className="mt-1 text-aviation-muted">Your company profile, users, buying preferences and account settings stay in place.</p></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setConfirmOpen(false)} className="min-h-11 rounded-xl border border-aviation-border px-5 py-3 text-sm font-semibold text-aviation-dark">Cancel</button><button type="button" onClick={upgrade} disabled={upgrading} className="min-h-11 rounded-xl bg-aviation-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{upgrading ? "Enabling selling…" : "Enable Selling"}</button></div></div></div>}
    </section>
  );
}
