import Link from "next/link";
import { requireRole } from "@/lib/auth-guard";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { createClient } from "@/lib/supabase/server";

export default async function IntelligencePage() {
  await requireRole(["supplier"]); await requireActiveSubscription("aviation_intelligence");
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from("aviation_intelligence_access").select("dataset_status,enabled").eq("user_id", user!.id).maybeSingle();
  return <main className="space-y-6"><header><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-aviation-accent">PLATINUM SERVICE</p><h1 className="text-3xl font-bold text-aviation-dark">Aviation Market Intelligence</h1><p className="mt-2 text-sm leading-6 text-aviation-muted">This workspace is ready for approved aviation intelligence datasets and reports. No market data is fabricated when a live source is unavailable.</p></header><section className="rounded-2xl border border-aviation-border bg-white p-6"><p className="text-xs uppercase tracking-wider text-aviation-muted">Dataset status</p><p className="mt-2 text-xl font-bold text-aviation-dark">{data?.dataset_status === "available" ? "Available" : "Setup required"}</p><p className="mt-2 text-sm text-aviation-muted">{data?.dataset_status === "available" ? "Approved intelligence datasets can be displayed here." : "Connect an approved intelligence source to populate this workspace."}</p></section><Link href="/supplier/marketing" className="inline-flex min-h-11 items-center text-sm font-semibold text-aviation-primary">Back to marketing</Link></main>;
}
