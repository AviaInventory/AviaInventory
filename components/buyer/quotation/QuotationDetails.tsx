"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getQuoteById,
  acceptQuote,
  rejectQuote,
} from "@/lib/rfqs";

import type { Quote } from "@/lib/rfqs";

import QuotationStatusBadge from "./QuotationStatusBadge";

interface Props {
  quoteId: string;
}

export default function QuotationDetails({
  quoteId,
}: Props) {
  const [quote, setQuote] = useState<Quote | null>(null);

  const [loading, setLoading] = useState(true);

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadQuote();
  }, []);

  async function loadQuote() {
    try {
      setLoading(true);

      const result = await getQuoteById(quoteId);

      if (result.success && result.data) {
        setQuote(result.data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!quote) return;

    setProcessing(true);

    try {
      const result = await acceptQuote(quote.id);

      if (!result.success) {
        alert("Unable to accept quotation.");
        return;
      }

      await loadQuote();

      alert("Quotation accepted.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!quote) return;

    setProcessing(true);

    try {
      const result = await rejectQuote(quote.id);

      if (!result.success) {
        alert("Unable to reject quotation.");
        return;
      }

      await loadQuote();

      alert("Quotation rejected.");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow">
        Loading quotation...
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow">
        <h2 className="text-2xl font-bold">
          Quotation Not Found
        </h2>

        <Link
          href="/buyer/quotations"
          className="mt-6 inline-block rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white"
        >
          Back to Quotations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <Link
        href="/buyer/quotations"
        className="inline-flex text-sm font-medium text-aviation-primary hover:underline"
      >
        ← Back to Quotations
      </Link>

      <section className="rounded-2xl bg-white p-8 shadow">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h1 className="text-4xl font-bold text-aviation-primary">
              {quote.rfq?.part?.part_number}
            </h1>

            <p className="mt-3 text-aviation-muted">
              Supplier: {quote.supplier?.company_name}
            </p>

          </div>

          <QuotationStatusBadge
            status={quote.status}
          />

        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">

          <div className="rounded-xl bg-aviation-light p-6">

            <p className="text-sm text-aviation-muted">
              Unit Price
            </p>

            <h2 className="mt-2 text-3xl font-bold text-aviation-primary">
              {quote.currency}{" "}
              {quote.unit_price.toLocaleString()}
            </h2>

          </div>

          <div className="rounded-xl bg-aviation-light p-6">

            <p className="text-sm text-aviation-muted">
              Lead Time
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {quote.lead_time}
            </h2>

          </div>

          <div className="rounded-xl bg-aviation-light p-6">

            <p className="text-sm text-aviation-muted">
              Warranty
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {quote.warranty || "-"}
            </h2>

          </div>

        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">

          <Detail
            title="Condition"
            value={quote.condition}
          />

          <Detail
            title="Certification"
            value={Array.isArray(quote.certification) ? quote.certification.join(", ") : quote.certification}
          />

          <Detail
            title="Valid Until"
            value={quote.valid_until}
          />

          <Detail
            title="Supplier Message"
            value={quote.message}
          />

        </div>

        <div className="mt-10 flex gap-4">

          <button
            onClick={handleAccept}
            disabled={processing}
            className="rounded-xl bg-aviation-success px-8 py-3 font-semibold text-white transition hover:bg-aviation-success disabled:opacity-50"
          >
            Accept Quote
          </button>

          <button
            onClick={handleReject}
            disabled={processing}
            className="rounded-xl bg-aviation-error px-8 py-3 font-semibold text-white transition hover:bg-aviation-error disabled:opacity-50"
          >
            Reject Quote
          </button>

        </div>

      </section>

    </div>
  );
}

function Detail({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-xl border bg-white p-5">

      <p className="text-sm text-aviation-muted">
        {title}
      </p>

      <p className="mt-2 font-medium">
        {value || "-"}
      </p>

    </div>
  );
}