import Link from "next/link";
import { requireRole } from "@/lib/auth-guard";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { createClient } from "@/lib/supabase/server";

export default async function FeaturedListingsPage() {
  await requireRole(["supplier"]); await requireActiveSubscription("featured_listings");
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  const [{ data: parts }, { data: featured }] = await Promise.all([
    supabase.from("parts").select("id,part_number,description,status,unit_price,currency").eq("supplier_id", user!.id).eq("status", "Published").order("created_at", { ascending: false }),
    supabase.from("featured_listings").select("id,listing_id,status,starts_at,ends_at").eq("supplier_id", user!.id).order("created_at", { ascending: false }),
  ]);
  const featuredIds = new Set((featured ?? []).map((row) => row.listing_id));
  return <main className="space-y-6"><header><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-aviation-accent">BRONZE SERVICE</p><h1 className="mt-1 text-3xl font-bold text-aviation-dark">Featured listings</h1><p className="mt-2 text-sm text-aviation-muted">Submit published inventory for moderated promotional placement. Availability is subject to platform capacity and approval.</p></header><section className="rounded-2xl border border-aviation-border bg-white p-5"><div className="space-y-2">{(parts ?? []).map((part) => <div key={part.id} className="flex flex-col gap-3 rounded-xl border border-aviation-border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-sm font-bold">{part.part_number}</p><p className="text-sm text-aviation-muted">{part.description || "Aircraft part listing"}</p></div>{featuredIds.has(part.id)?<span className="rounded-full bg-aviation-success-soft px-3 py-2 text-xs font-semibold text-aviation-primary">Submitted / active record</span>:<form action="/api/supplier/marketing/featured" method="post"><input type="hidden" name="listingId" value={part.id}/><button className="min-h-11 rounded-xl bg-aviation-primary px-4 py-2.5 text-sm font-semibold text-white">Request featured placement</button></form>}</div>)}{(parts ?? []).length===0&&<p className="py-8 text-center text-sm text-aviation-muted">Publish a listing before requesting featured placement.</p>}</div><Link href="/supplier/marketing" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-aviation-primary">Back to marketing</Link></section></main>;
}
