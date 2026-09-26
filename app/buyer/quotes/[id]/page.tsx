"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  getQuoteById,
  acceptQuote,
  rejectQuote,
  formatCurrency,
  formatDate,
  type Quote,
  QuoteStatus,
  RFQStatus,
} from "@/lib/rfqs";

export default function BuyerQuoteDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const quoteId = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!quoteId) return;

    loadQuote();
  }, [quoteId]);

  async function loadQuote() {
    try {
      setLoading(true);

      const result = await getQuoteById(quoteId);

      if (!result.success || !result.data) {
        console.error(
          "Failed to load quote:",
          result.error
        );

        return;
      }

      setQuote(result.data);
    } catch (error) {
      console.error(
        "Failed to load quote:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!quote) return;

    const confirmed = window.confirm(
      "Are you sure you want to accept this quotation?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      const result = await acceptQuote(
        quote.id
      );

      if (!result.success) {
        alert(
          typeof result.error === "string"
            ? result.error
            : "Unable to accept the quotation."
        );

        return;
      }

      alert(
        "Quotation accepted successfully."
      );

      await loadQuote();
      router.refresh();
    } catch (error) {
      console.error(
        "Failed to accept quote:",
        error
      );

      alert(
        "Unable to accept the quotation."
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!quote) return;

    const confirmed = window.confirm(
      "Are you sure you want to reject this quotation?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      const result = await rejectQuote(
        quote.id
      );

      if (!result.success) {
        alert(
          typeof result.error === "string"
            ? result.error
            : "Unable to reject the quotation."
        );

        return;
      }

      alert(
        "Quotation rejected successfully."
      );

      await loadQuote();
      router.refresh();
    } catch (error) {
      console.error(
        "Failed to reject quote:",
        error
      );

      alert(
        "Unable to reject the quotation."
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-aviation-muted">
          Loading quotation...
        </p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow">

        <h2 className="text-2xl font-bold text-aviation-primary">
          Quotation Not Found
        </h2>

        <p className="mt-2 text-aviation-muted">
          The requested quotation could not be found.
        </p>

        <Link
          href="/buyer/rfqs"
          className="mt-6 inline-block rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white"
        >
          Back to My RFQs
        </Link>

      </div>
    );
  }

  const rfq = quote.rfq;

  const canAccept =
    quote.status === QuoteStatus.Sent &&
    rfq?.status !== RFQStatus.Cancelled &&
    rfq?.status !== RFQStatus.Closed;

  const canReject =
    quote.status === QuoteStatus.Sent &&
    rfq?.status !== RFQStatus.Cancelled &&
    rfq?.status !== RFQStatus.Closed;

  return (
    <div className="space-y-8">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div>

        <Link
          href={
            rfq
              ? `/buyer/rfqs/${rfq.id}`
              : "/buyer/rfqs"
          }
          className="text-sm font-medium text-aviation-primary hover:underline"
        >
          ← Back to RFQ
        </Link>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

          <div>

            <h1 className="text-4xl font-bold text-aviation-primary">
              Supplier Quotation
            </h1>

            <p className="mt-2 text-aviation-muted">
              Quote #{quote.id.slice(0, 8).toUpperCase()}
            </p>

          </div>

          <div
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              quote.status === QuoteStatus.Accepted
                ? "bg-aviation-success-soft text-aviation-success"
                : quote.status === QuoteStatus.Rejected
                ? "bg-aviation-error-soft text-aviation-error"
                : quote.status === QuoteStatus.Expired
                ? "bg-aviation-warning-soft text-aviation-warning"
                : "bg-aviation-success-soft text-aviation-success"
            }`}
          >
            {quote.status}
          </div>

        </div>

      </div>

      {/* =====================================================
          SUPPLIER
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="text-2xl font-bold text-aviation-primary">
          Supplier
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">

          <InfoItem
            label="Company"
            value={
              quote.supplier?.company_name
            }
          />

          <InfoItem
            label="Country"
            value={
              quote.supplier?.country
            }
          />

          <InfoItem
            label="Quotation Date"
            value={formatDate(
              quote.created_at
            )}
          />

          <InfoItem
            label="Valid Until"
            value={formatDate(
              quote.valid_until
            )}
          />

        </div>

      </section>

      {/* =====================================================
          RFQ INFORMATION
      ====================================================== */}

      {rfq && (
        <section className="rounded-2xl bg-white p-8 shadow">

          <h2 className="text-2xl font-bold text-aviation-primary">
            RFQ Information
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">

            <InfoItem
              label="RFQ Number"
              value={
                `#${rfq.id
                  .slice(0, 8)
                  .toUpperCase()}`
              }
            />

            <InfoItem
              label="Part Number"
              value={
                rfq.part_number
              }
            />

            <InfoItem
              label="Description"
              value={
                rfq.description
              }
            />

            <InfoItem
              label="Quantity"
              value={
                String(rfq.quantity)
              }
            />

            <InfoItem
              label="Required Date"
              value={formatDate(
                rfq.required_date
              )}
            />

            <InfoItem
              label="Delivery Location"
              value={
                rfq.delivery_location
              }
            />

          </div>

        </section>
      )}

      {/* =====================================================
          QUOTATION
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="text-2xl font-bold text-aviation-primary">
          Quotation Details
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-xl bg-aviation-success-soft p-5">

            <p className="text-sm font-medium text-aviation-muted">
              Unit Price
            </p>

            <p className="mt-2 text-3xl font-bold text-aviation-primary">
              {formatCurrency(
                quote.unit_price,
                quote.currency
              )}
            </p>

          </div>

          <InfoItem
            label="Currency"
            value={quote.currency}
          />

          <InfoItem
            label="Lead Time"
            value={quote.lead_time}
          />

          <InfoItem
            label="Condition"
            value={quote.condition}
          />

          <InfoItem
            label="Warranty"
            value={quote.warranty}
          />

          <InfoItem
            label="Valid Until"
            value={formatDate(
              quote.valid_until
            )}
          />

        </div>

      </section>

      {/* =====================================================
          CERTIFICATION
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="text-2xl font-bold text-aviation-primary">
          Certification
        </h2>

        {quote.certification?.length ? (

          <div className="mt-5 flex flex-wrap gap-3">

            {quote.certification.map(
              (certificate) => (
                <span
                  key={certificate}
                  className="rounded-full bg-aviation-light px-4 py-2 text-sm font-medium text-aviation-dark"
                >
                  {certificate}
                </span>
              )
            )}

          </div>

        ) : (

          <p className="mt-4 text-aviation-muted">
            No certification information
            provided.
          </p>

        )}

      </section>

      {/* =====================================================
          SUPPLIER MESSAGE
      ====================================================== */}

      {quote.message && (
        <section className="rounded-2xl bg-white p-8 shadow">

          <h2 className="text-2xl font-bold text-aviation-primary">
            Supplier Message
          </h2>

          <div className="mt-5 rounded-xl bg-aviation-light p-5">

            <p className="whitespace-pre-wrap leading-7 text-aviation-dark">
              {quote.message}
            </p>

          </div>

        </section>
      )}

      {/* =====================================================
          ACTIONS
      ====================================================== */}

      {(canAccept || canReject) && (
        <section className="rounded-2xl border border-aviation-border bg-aviation-success-soft p-8">

          <h2 className="text-xl font-bold text-aviation-primary">
            Review Quotation
          </h2>

          <p className="mt-2 text-sm leading-6 text-aviation-muted">
            Review the supplier's pricing, condition,
            lead time and certification before making
            your decision.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">

            {canReject && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleReject}
                className="rounded-xl border border-aviation-border bg-white px-7 py-3 font-semibold text-aviation-error transition hover:bg-aviation-error-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading
                  ? "Processing..."
                  : "Reject Quote"}
              </button>
            )}

            {canAccept && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleAccept}
                className="rounded-xl bg-aviation-primary px-7 py-3 font-semibold text-white transition hover:bg-aviation-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading
                  ? "Processing..."
                  : "Accept Quote"}
              </button>
            )}

          </div>

        </section>
      )}

    </div>
  );
}

/* ==========================================================
   INFO ITEM
========================================================== */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-aviation-muted">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-wrap text-aviation-dark">
        {value || "-"}
      </p>
    </div>
  );
}