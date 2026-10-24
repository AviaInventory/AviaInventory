"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

import { supabase } from "@/lib/supabase";
import {
  getQuoteById,
  supplierRFQStatus,
  formatCurrency,
  formatDate,
  type Quote,
} from "@/lib/rfqs";

import QuoteStatusBadge from "./QuoteStatusBadge";
import RFQStatusBadge from "../rfq/RFQStatusBadge";
import RFQTypeBadge from "../rfq/RFQTypeBadge";

/** A sent quotation, read-only: quotations are historical records once sent. */
export default function QuoteDetails({ quoteId }: { quoteId: string }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [{ data: { user } }, result] = await Promise.all([
          supabase.auth.getUser(),
          getQuoteById(quoteId),
        ]);
        if (!active) return;
        // Only the supplier who sent it sees it here; buyers have their own quotation pages.
        setQuote(result.success && result.data && result.data.supplier_id === user?.id ? result.data : null);
      } catch (error) {
        console.error("GET QUOTE ERROR:", error);
        if (active) setQuote(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [quoteId]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-aviation-muted">Loading quotation...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <h2 className="text-2xl font-bold text-aviation-primary">Quotation Not Found</h2>
        <p className="mt-2 text-aviation-muted">
          This quotation doesn&apos;t exist or isn&apos;t one you submitted.
        </p>
        <Link
          href="/supplier/quotes"
          className="mt-6 inline-flex rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white transition hover:bg-aviation-primary"
        >
          Back to My Quotations
        </Link>
      </div>
    );
  }

  const rfq = quote.rfq;
  const quantity = Number(rfq?.quantity ?? 0);
  const unitPrice = Number(quote.unit_price ?? 0);
  const certifications = (quote.certification ?? []).filter(Boolean);
  const isMRO = rfq?.rfq_type === "mro";

  return (
    <div className="space-y-6">

      {/* ======================================================
         HEADER
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-aviation-accent">
              Quotation
            </p>
            <h2 className="mt-1 text-3xl font-bold text-aviation-primary">
              Quote #{quote.id.slice(0, 8).toUpperCase()}
            </h2>
            <p className="mt-2 text-sm text-aviation-muted">
              Submitted {formatDate(quote.created_at)} for RFQ #{quote.rfq_id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <QuoteStatusBadge status={quote.status} />
        </div>

        <p className="mt-6 flex items-center gap-2 rounded-xl border border-aviation-border bg-aviation-light px-4 py-3 text-sm text-aviation-muted">
          <Lock size={16} className="shrink-0" aria-hidden="true" />
          Sent quotations are a historical record and can&apos;t be edited.
        </p>
      </section>

      {/* ======================================================
         COMMERCIAL TERMS
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">
        <h3 className="mb-6 text-2xl font-bold text-aviation-primary">
          Quoted Terms
        </h3>

        <div className="grid gap-4 sm:grid-cols-3">
          <Highlight label="Unit Price" value={formatCurrency(unitPrice, quote.currency || "USD")} />
          <Highlight label="Quantity" value={quantity ? quantity.toLocaleString() : "-"} />
          <Highlight
            label="Total"
            value={quantity ? formatCurrency(unitPrice * quantity, quote.currency || "USD") : "-"}
            strong
          />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Detail label="Currency" value={quote.currency} />
          <Detail label="Lead Time" value={quote.lead_time} />
          <Detail label="Condition" value={quote.condition} />
          <Detail label="Warranty" value={quote.warranty} />
          <Detail label="Valid Until" value={formatDate(quote.valid_until)} />
          <Detail label="Submitted" value={formatDate(quote.created_at)} />
          <Detail label="Certification" value={certifications.length ? certifications.join(", ") : null} />
        </div>

        <div className="mt-8">
          <h4 className="mb-2 text-lg font-semibold text-aviation-dark">Message to Buyer</h4>
          <div className="whitespace-pre-line rounded-xl border bg-aviation-light p-5 leading-7 text-aviation-dark">
            {quote.message || "No message included."}
          </div>
        </div>
      </section>

      {/* ======================================================
         RFQ SUMMARY
      ====================================================== */}

      <section className="rounded-2xl border border-aviation-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-bold text-aviation-dark">RFQ Summary</h3>
          {rfq && (
            <div className="flex flex-wrap items-center gap-2">
              <RFQTypeBadge type={rfq.rfq_type} />
              <RFQStatusBadge status={supplierRFQStatus(rfq, quote)} />
            </div>
          )}
        </div>

        {rfq ? (
          <>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {isMRO && <Summary label="Component" value={rfq.component} />}
              <Summary label="Part Number" value={rfq.part_number} />
              <Summary label="Quantity" value={String(rfq.quantity)} />
              <Summary label="Required By" value={formatDate(rfq.required_date)} />
              <Summary label="Buyer" value={rfq.buyer?.company_name ?? rfq.buyer?.full_name} />
              {isMRO && <Summary label="Forward Exchange" value={rfq.forward_exchange} />}
            </dl>

            <Link
              href={`/supplier/rfqs/${quote.rfq_id}`}
              className="mt-5 inline-flex text-sm font-semibold text-aviation-primary hover:underline"
            >
              View RFQ →
            </Link>
          </>
        ) : (
          <p className="mt-4 text-sm text-aviation-muted">The RFQ for this quotation is no longer available.</p>
        )}
      </section>

      <div className="pb-6">
        <Link
          href="/supplier/quotes"
          className="inline-flex rounded-xl border border-aviation-border px-6 py-3 font-semibold text-aviation-primary transition hover:bg-aviation-primary hover:text-white"
        >
          ← Back to My Quotations
        </Link>
      </div>

    </div>
  );
}

function Highlight({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${strong ? "border-aviation-primary/30 bg-aviation-primary/5" : "border-aviation-border bg-aviation-light"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-aviation-muted">{label}</p>
      <p className={`mt-1 font-mono text-xl font-bold ${strong ? "text-aviation-primary" : "text-aviation-dark"}`}>{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-sm font-medium text-aviation-muted">{label}</p>
      <p className="mt-2 min-h-[48px] rounded-lg border bg-aviation-light p-3 font-medium text-aviation-dark">
        {value || "-"}
      </p>
    </div>
  );
}

function Summary({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-aviation-muted">{label}</dt>
      <dd className="mt-1 font-medium text-aviation-dark">{value || "-"}</dd>
    </div>
  );
}
