"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RFQComparisonView from "@/components/buyer/rfq/RFQComparisonView";
import { getRFQById, getQuotesForRFQ, type RFQ, type Quote } from "@/lib/rfqs";

export default function RFQComparisonPage() {
  const params = useParams();
  const rfqId = params.id as string;
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [rfqResult, quoteData] = await Promise.all([getRFQById(rfqId), getQuotesForRFQ(rfqId)]);
      if (rfqResult.success) setRfq(rfqResult.data ?? null);
      setQuotes(quoteData);
      setLoading(false);
    })();
  }, [rfqId]);

  if (loading) return <div className="py-20 text-center text-aviation-muted">Loading RFQ comparison…</div>;
  if (!rfq) return <div className="rounded-2xl border border-aviation-border bg-white p-10 text-center"><h1 className="text-2xl font-bold text-aviation-dark">RFQ not found</h1><Link href="/buyer/rfqs" className="mt-4 inline-block font-semibold text-aviation-primary">Back to RFQs</Link></div>;
  if (quotes.length < 2) return <div className="rounded-2xl border border-aviation-border bg-white p-10 text-center"><h1 className="text-2xl font-bold text-aviation-dark">Not enough responses</h1><p className="mt-2 text-aviation-muted">RFQ comparison becomes available after at least two supplier responses are received.</p><Link href={`/buyer/rfqs/${rfq.id}`} className="mt-4 inline-block font-semibold text-aviation-primary">Back to RFQ</Link></div>;

  return <div className="space-y-7"><div><Link href={`/buyer/rfqs/${rfq.id}`} className="text-sm font-semibold text-aviation-primary hover:underline">← Back to RFQ</Link><h1 className="mt-4 text-3xl font-bold text-aviation-dark">RFQ #{rfq.id.slice(0, 8).toUpperCase()} comparison</h1><p className="mt-2 text-sm text-aviation-muted">{rfq.part_number || "Custom RFQ"} · {quotes.length} supplier responses</p></div><RFQComparisonView rfqId={rfq.id} initialQuotes={quotes}/></div>;
}
