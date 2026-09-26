"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, Building2, ChevronRight, FileCheck2, Globe2, LockKeyhole, ReceiptText, ShieldCheck, SlidersHorizontal, UserCircle, Users, ShoppingCart, Store, Menu, X, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import RoleSwitcher from "@/components/account/RoleSwitcher";
import HybridAccountCard from "@/components/account/HybridAccountCard";

const baseItems = [
  ["profile", "Personal Profile", UserCircle],
  ["company", "Company Profile", Building2],
  ["team", "Users / Team", Users],
  ["buying", "Buying Preferences", ShoppingCart],
  ["selling", "Selling Preferences", Store],
  ["verification", "Supplier Verification", ShieldCheck],
  ["documents", "Compliance & Documents", FileCheck2],
  ["security", "Security", LockKeyhole],
  ["notifications", "Notifications", Bell],
  ["preferences", "Preferences", SlidersHorizontal],
  ["billing", "Billing / Financial", ReceiptText],
  ["subscription", "Subscription", ReceiptText],
  ["privacy", "Privacy & Controls", Globe2],
] as const;

export default function AccountCenterShell({ section, children }: { section: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [roles, setRoles] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => { supabase.auth.getUser().then(async ({ data: { user } }) => { if (!user) return; const { data } = await supabase.from("profiles").select("account_roles,account_type").eq("id", user.id).maybeSingle(); const r = Array.isArray(data?.account_roles) && data.account_roles.length ? data.account_roles : [data?.account_type]; setRoles(r.filter(Boolean)); }); }, []);
  const items = useMemo(() => baseItems.filter(([key]) => {
    if (key === "buying") return roles.includes("buyer") || roles.includes("admin");
    if (key === "selling" || key === "verification" || key === "documents") return roles.includes("supplier") || roles.includes("admin");
    return true;
  }), [roles]);
  return <div className="min-h-[calc(100vh-72px)] bg-aviation-light">
    <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-aviation-primary"><ArrowLeft size={16}/> AviaInventory</Link>
        <RoleSwitcher active={roles.includes("supplier") && !roles.includes("buyer") ? "supplier" : "buyer"} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-white p-3 shadow-sm lg:block">
          <div className="px-3 py-4"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-aviation-accent">ACCOUNT CENTRE</p><h1 className="mt-1 text-lg font-bold text-aviation-dark">Company account</h1><p className="mt-1 text-xs leading-5 text-aviation-muted">Manage people, procurement, compliance and company controls.</p></div>
          <nav className="space-y-1" aria-label="Account management">{items.map(([key,label,Icon]) => <Link key={key} href={`/account/${key}`} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${section===key ? "bg-aviation-primary text-white" : "text-aviation-muted hover:bg-aviation-light hover:text-aviation-dark"}`}><Icon size={17}/><span className="min-w-0 flex-1">{label}</span>{section===key&&<ChevronRight size={15}/>}</Link>)}</nav>
        </aside>
        <div className="lg:hidden">
          <button onClick={()=>setOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-aviation-border bg-white px-4 text-sm font-semibold text-aviation-dark shadow-sm"><Menu size={17}/> Account menu</button>
          {open&&<div className="fixed inset-0 z-[110] bg-aviation-dark/50" role="dialog" aria-modal="true"><div className="h-full w-[min(88vw,360px)] overflow-y-auto bg-white p-4 shadow-2xl"><div className="flex items-center justify-between px-2 py-2"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-aviation-accent">ACCOUNT CENTRE</p><p className="font-bold text-aviation-dark">Company account</p></div><button onClick={()=>setOpen(false)} className="min-h-11 min-w-11 rounded-lg" aria-label="Close account menu"><X size={18}/></button></div><nav className="mt-3 space-y-1">{items.map(([key,label,Icon])=><Link onClick={()=>setOpen(false)} key={key} href={`/account/${key}`} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${section===key?"bg-aviation-primary text-white":"text-aviation-muted"}`}><Icon size={17}/>{label}</Link>)}</nav></div></div>}
        </div>
        <main className="min-w-0">{children}<div className="mt-5"><HybridAccountCard activeRole="buyer" /></div></main>
      </div>
    </div>
  </div>;
}
