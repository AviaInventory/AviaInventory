"use client";

import Link from "next/link";
import { CalendarClock, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SubscriptionStatusCard() {
  const [state, setState] = useState<{ plan: string; status: string; days: number | null; periodEnd: string | null } | null>(null);
  useEffect(() => { let mounted = true; (async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { data } = await supabase.from("subscriptions").select("plan_code,status,trial_ends_at,current_period_end").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(); if (!mounted || !data) return; const days = data.trial_ends_at ? Math.max(0, Math.ceil((new Date(data.trial_ends_at).getTime() - Date.now()) / 86_400_000)) : null; setState({ plan: String(data.plan_code).replaceAll("buyer_", "").replaceAll("hybrid_", "").replace("_", " ").replace(/^./, (c) => c.toUpperCase()), status: data.status, days, periodEnd: data.current_period_end }); })(); return () => { mounted = false; }; }, []);
  if (!state) return null;
  const urgent = state.status === "trialing" && state.days !== null && state.days <= 7;
  const reminder = state.status === "trialing" && state.days !== null ? state.days <= 1 ? "Your free trial ends tomorrow. Choose a plan to continue using AviaInventory." : state.days <= 3 ? "Your free trial ends in 3 days or less. Review your subscription options." : state.days <= 7 ? "Your free trial ends soon. Review your subscription options." : state.days <= 14 ? "Your free trial ends within 14 days. You can choose a paid plan now." : null : null;
  return <section className={`rounded-2xl border p-4 ${urgent ? "border-amber-200 bg-amber-50" : "border-aviation-border bg-white"}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-aviation-light text-aviation-primary">{state.status === "trialing" ? <CalendarClock size={19}/> : <CreditCard size={19}/>}</span><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-aviation-muted">YOUR PLAN</p><p className="font-bold text-aviation-dark">{state.plan}</p><p className="text-xs text-aviation-muted">{state.status === "trialing" && state.days !== null ? `${state.days} days remaining` : state.periodEnd ? `Renews ${new Date(state.periodEnd).toLocaleDateString("en-GB")}` : state.status.replaceAll("_", " ")}</p>{reminder && <p className="mt-1 max-w-xl text-xs font-medium text-amber-800">{reminder}</p>}</div></div><Link href="/account/subscription" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-aviation-border bg-white px-4 py-2.5 text-sm font-semibold text-aviation-dark">Manage subscription</Link></div></section>;
}
