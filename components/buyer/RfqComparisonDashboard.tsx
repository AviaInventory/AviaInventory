"use client";

import Link from "next/link";
import { ArrowRight, GitCompareArrows } from "lucide-react";
import { useEffect, useState } from "react";
import { getBuyerRFQs, getQuotesForRFQ, type RFQ } from "@/lib/rfqs";

export default function RfqComparisonDashboard() {
  const [items, setItems] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rfqs = await getBuyerRFQs();
      const withResponses: RFQ[] = [];
      for (const rfq of rfqs) {
        if ((rfq.quote_count ?? 0) < 2) continue;
        const quotes = await getQuotesForRFQ(rfq.id);
        if (quotes.length >= 2 && mounted) withResponses.push(rfq);
      }
      if (mounted) setItems(withResponses.slice(0, 5));
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  if (loading || !items.length) return null;

  return (
    <section className="rounded-2xl border border-aviation-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-aviation-accent">Supplier responses</p>
          <h2 className="mt-1 text-xl font-bold text-aviation-dark">RFQ Comparison</h2>
          <p className="mt-1 text-sm text-aviation-muted">RFQs with multiple supplier responses are ready for side-by-side review.</p>
        </div>
        <GitCompareArrows className="hidden text-aviation-accent sm:block" size={24}/>
      </div>
      <div className="mt-5 divide-y divide-aviation-border">
        {items.map((rfq) => (
          <div key={rfq.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs font-bold text-aviation-primary">RFQ #{rfq.id.slice(0, 8).toUpperCase()}</p>
              <p className="mt-1 font-semibold text-aviation-dark">{rfq.part_number || "Custom RFQ"}</p>
              <p className="mt-1 text-sm text-aviation-muted">{rfq.quote_count} supplier responses · {rfq.description || "Compare received quotations"}</p>
            </div>
            <Link href={`/buyer/rfqs/${rfq.id}/comparison`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-aviation-primary px-4 py-2.5 text-sm font-bold text-white">Compare responses <ArrowRight size={15}/></Link>
          </div>
        ))}
      </div>
    </section>
  );
}
