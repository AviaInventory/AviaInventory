"use client";

import Link from "next/link";
import { Clock3, MessageSquare, Star, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { acceptQuote, getQuotesForRFQ, updateQuoteStatus, QuoteStatus, type Quote } from "@/lib/rfqs";

function useCountdown(validUntil: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const remaining = new Date(validUntil).getTime() - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return "Expired";
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${hours}h ${minutes}m ${seconds}s`;
}

function Expiry({ value }: { value: string }) {
  const countdown = useCountdown(value);
  const expired = countdown === "Expired";
  return <span className={expired ? "font-semibold text-aviation-error" : "font-mono text-xs text-aviation-muted"}>{countdown}</span>;
}

function statusLabel(status: Quote["status"]) {
  if (status === "Rejected") return "Not selected";
  if (status === "Accepted") return "Accepted";
  if (status === "Expired") return "Expired";
  return "Awaiting decision";
}

interface Props {
  rfqId: string;
  initialQuotes: Quote[];
}

export default function RFQComparisonView({ rfqId, initialQuotes }: Props) {
  const router = useRouter();
  const [quotes, setQuotes] = useState(initialQuotes);
  const [processing, setProcessing] = useState<string | null>(null);

  const sortedQuotes = useMemo(() => [...quotes].sort((a, b) => a.unit_price - b.unit_price), [quotes]);

  async function refresh() {
    const next = await getQuotesForRFQ(rfqId);
    setQuotes(next);
  }

  async function handleAccept(quote: Quote) {
    if (processing) return;
    if (quote.status !== "Sent") {
      window.alert(`This response is ${statusLabel(quote.status).toLowerCase()} and cannot be accepted.`);
      return;
    }
    if (new Date(quote.valid_until).getTime() <= Date.now()) {
      window.alert("This quotation has expired.");
      return;
    }
    if (!window.confirm(`Accept ${quote.supplier?.company_name || "this supplier"}'s response? Other responses will be marked Not selected.`)) return;

    setProcessing(quote.id);
    try {
      const result = await acceptQuote(quote.id);
      if (!result.success) throw new Error(typeof result.error === "string" ? result.error : "Unable to accept response.");

      for (const other of quotes.filter((item) => item.id !== quote.id && item.status === "Sent")) {
        await updateQuoteStatus(other.id, QuoteStatus.Rejected);
      }

      const supplierId = quote.supplier_id;
      if (supplierId) {
        const message = `RFQ response accepted. Your quotation for RFQ #${rfqId.slice(0, 8).toUpperCase()} has been selected by the buyer.`;
        const { error: messageError } = await supabase.from("messages").insert({
          rfq_id: rfqId,
          sender_id: quote.buyer_id,
          recipient_id: supplierId,
          message,
          is_read: false,
        });
        if (messageError) console.warn("Supplier acceptance message could not be created:", messageError);
        const { error: notificationError } = await supabase.from("notifications").insert({
          user_id: supplierId,
          title: "RFQ response accepted",
          message,
          is_read: false,
        });
        if (notificationError) console.warn("Supplier notification could not be created:", notificationError);
      }

      await refresh();
      router.refresh();
      window.alert("Response accepted. Other supplier responses were marked Not selected and the selected supplier was notified.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to accept this response.");
    } finally {
      setProcessing(null);
    }
  }

  if (quotes.length < 2) return null;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-aviation-accent">RFQ Comparison</p>
          <h2 className="mt-1 text-2xl font-bold text-aviation-dark">Compare supplier responses</h2>
          <p className="mt-1 text-sm text-aviation-muted">Review price, delivery, condition, certification and expiry before selecting a supplier.</p>
        </div>
        <Link href={`/buyer/rfqs/${rfqId}`} className="text-sm font-semibold text-aviation-primary hover:underline">Open RFQ details →</Link>
      </div>

      <div className="aviation-table-wrap rounded-2xl border border-aviation-border bg-white shadow-sm">
        <table className="min-w-[1080px] w-full text-sm">
          <thead className="bg-aviation-light">
            <tr>
              {['Supplier', 'Price', 'Lead time', 'Condition', 'Certification', 'Quote expiry', 'Decision', ''].map((heading) => (
                <th key={heading} className="px-4 py-4 text-left font-semibold text-aviation-dark">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedQuotes.map((quote) => {
              const accepted = quote.status === "Accepted";
              const canAccept = quote.status === "Sent" && new Date(quote.valid_until).getTime() > Date.now();
              return (
                <tr key={quote.id} className="border-t border-aviation-border align-top">
                  <td className="px-4 py-5">
                    <div className="font-semibold text-aviation-dark">{quote.supplier?.company_name || "Supplier"}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-aviation-muted"><Star size={13} /> {quote.supplier?.country || "Country not provided"} · Rating unavailable</div>
                  </td>
                  <td className="px-4 py-5 font-bold text-aviation-primary">{quote.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {quote.currency}</td>
                  <td className="px-4 py-5 text-aviation-dark">{quote.lead_time || "—"}</td>
                  <td className="px-4 py-5 text-aviation-dark">{quote.condition || "—"}</td>
                  <td className="px-4 py-5 text-aviation-dark">{quote.certification?.length ? quote.certification.join(", ") : "None"}</td>
                  <td className="px-4 py-5"><div className="flex items-center gap-2"><Clock3 size={14} className="text-aviation-muted"/><Expiry value={quote.valid_until} /></div><div className="mt-1 text-xs text-aviation-muted">{new Date(quote.valid_until).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div></td>
                  <td className="px-4 py-5"><span className={accepted ? "inline-flex items-center gap-1 rounded-full bg-aviation-success-soft px-2.5 py-1 text-xs font-bold text-aviation-success" : quote.status === "Rejected" ? "inline-flex rounded-full bg-aviation-error-soft px-2.5 py-1 text-xs font-bold text-aviation-error" : "inline-flex rounded-full bg-aviation-light px-2.5 py-1 text-xs font-bold text-aviation-dark"}>{accepted && <CheckCircle2 size={13}/>} {statusLabel(quote.status)}</span></td>
                  <td className="px-4 py-5">
                    <div className="flex min-w-[150px] flex-col gap-2">
                      <Link href={`/buyer/messages?rfqId=${rfqId}&supplierId=${quote.supplier_id}`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-aviation-border px-3 py-2 text-xs font-bold text-aviation-dark hover:bg-aviation-light"><MessageSquare size={14}/> Message supplier</Link>
                      {canAccept && <button type="button" disabled={Boolean(processing)} onClick={() => handleAccept(quote)} className="rounded-lg bg-aviation-success px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{processing === quote.id ? "Accepting…" : "Accept"}</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
