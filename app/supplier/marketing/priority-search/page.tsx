import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, Search } from "lucide-react";
import { requireRole } from "@/lib/auth-guard";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Matches marketplace_supplier_search_boosts (supabase migrations).
const BOOST_LEVELS: Record<number, string> = { 25: "Platinum", 15: "Bronze" };

export default async function PrioritySearchPage() {
  await requireRole(["supplier"]);
  await requireActiveSubscription("priority_search");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: boostRows }, { data: parts, count }] = await Promise.all([
    supabase.rpc("marketplace_supplier_search_boosts", { p_supplier_ids: [user!.id] }),
    supabase
      .from("parts")
      .select("id,part_number,description,manufacturer", { count: "exact" })
      .eq("supplier_id", user!.id)
      .eq("status", "Published")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // The live boost the marketplace applies right now, read from the same function search uses.
  const boost = Number((boostRows as Array<{ boost: number }> | null)?.[0]?.boost ?? 0);
  const level = BOOST_LEVELS[boost] ?? null;
  const published = count ?? 0;

  return (
    <main className="space-y-6">
      <header>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-aviation-accent">MARKETPLACE VISIBILITY</p>
        <h1 className="mt-1 text-3xl font-bold text-aviation-dark">Priority search</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-aviation-muted">
          When buyers search the marketplace, your published listings are ranked ahead of other matching listings. There is nothing to
          set up — the boost applies automatically to every published listing while your plan includes it.
        </p>
      </header>

      <section className={`rounded-2xl border p-5 sm:p-6 ${level ? "border-aviation-primary/30 bg-white" : "border-amber-200 bg-amber-50"}`}>
        <div className="flex items-start gap-3">
          {level ? (
            <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-aviation-success" aria-hidden="true" />
          ) : (
            <Search size={22} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
          )}
          <div>
            <h2 className="font-bold text-aviation-dark">
              {level ? `Active — ${level} priority` : "Not active yet"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-aviation-muted">
              {level
                ? `${published.toLocaleString()} published listing${published === 1 ? "" : "s"} currently receive${published === 1 ? "s" : ""} the boost.${level === "Bronze" ? " Platinum listings rank above Bronze." : ""}`
                : "Your plan includes priority search, but the marketplace is not applying the boost to your account yet. Please contact AviaInventory support so we can check your subscription."}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-aviation-border bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold text-aviation-dark">How it works</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-aviation-muted">
          <li>• The boost applies to marketplace searches and browsing with the default “Newest” order.</li>
          <li>• Only listings that match the buyer&apos;s search and filters are shown — the boost changes the order, not what matches.</li>
          <li>• If a buyer sorts by price or rating, that sort order is used instead.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-aviation-border bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold text-aviation-dark">Check your listings in search</h2>
        <p className="mt-1 text-sm text-aviation-muted">Open a search for any part number to see where your listing appears.</p>
        <div className="mt-4 space-y-2">
          {(parts ?? []).map((part) => (
            <div key={part.id} className="flex flex-col gap-3 rounded-xl border border-aviation-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold text-aviation-dark">{part.part_number}</p>
                <p className="truncate text-sm text-aviation-muted">
                  {[part.manufacturer, part.description].filter(Boolean).join(" · ") || "Aircraft part listing"}
                </p>
              </div>
              <Link
                href={`/marketplace?q=${encodeURIComponent(part.part_number)}`}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-aviation-border px-4 py-2.5 text-sm font-semibold text-aviation-dark hover:border-aviation-primary"
              >
                <ExternalLink size={15} aria-hidden="true" /> See in search
              </Link>
            </div>
          ))}
          {published === 0 && (
            <p className="py-8 text-center text-sm text-aviation-muted">
              Publish a listing and it will be boosted in search automatically.{" "}
              <Link href="/supplier/inventory/new" className="font-semibold text-aviation-primary">Add a listing</Link>
            </p>
          )}
          {published > (parts ?? []).length && (
            <p className="pt-2 text-xs text-aviation-muted">Showing your 20 most recent of {published.toLocaleString()} published listings.</p>
          )}
        </div>
      </section>

      <Link href="/supplier/marketing" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-aviation-primary">
        <ArrowLeft size={16} aria-hidden="true" /> Back to marketing
      </Link>
    </main>
  );
}
