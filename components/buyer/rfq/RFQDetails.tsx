"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getRFQById,
  getQuotesForRFQ,
  closeRFQ,
  cancelRFQ,
  RFQ,
  Quote,
  formatDate,
} from "@/lib/rfqs";

import RFQStatusBadge from "./RFQStatusBadge";
import QuoteComparisonTable from "./QuoteComparisonTable";
import RFQTimeline from "./RFQTimeline";
import BuyerRFQMessageThread from "./BuyerRFQMessageThread";

interface Props {
  rfqId: string;
}

export default function RFQDetails({
  rfqId,
}: Props) {
  const [rfq, setRFQ] = useState<RFQ | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [rfqId]);

  async function loadData() {
    try {
      setLoading(true);

      const rfqResult = await getRFQById(rfqId);

      if (!rfqResult.success || !rfqResult.data) {
        setRFQ(null);
        setQuotes([]);
        return;
      }

      setRFQ(rfqResult.data);

      const quoteData = await getQuotesForRFQ(rfqId);

      setQuotes(quoteData);
    } catch (error) {
      console.error("GET BUYER RFQ ERROR:", error);
      setRFQ(null);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================
     CLOSE RFQ
  ========================================================== */

  async function handleClose() {
    if (!rfq) return;

    if (!confirm("Close this RFQ?")) {
      return;
    }

    try {
      setProcessing(true);

      const result = await closeRFQ(rfq.id);

      if (!result.success) {
        console.error("CLOSE RFQ ERROR:", result.error);
        return;
      }

      await loadData();
    } catch (error) {
      console.error("CLOSE RFQ ERROR:", error);
    } finally {
      setProcessing(false);
    }
  }

  /* ==========================================================
     CANCEL RFQ
  ========================================================== */

  async function handleCancel() {
    if (!rfq) return;

    if (!confirm("Cancel this RFQ?")) {
      return;
    }

    try {
      setProcessing(true);

      const result = await cancelRFQ(rfq.id);

      if (!result.success) {
        console.error("CANCEL RFQ ERROR:", result.error);
        return;
      }

      await loadData();
    } catch (error) {
      console.error("CANCEL RFQ ERROR:", error);
    } finally {
      setProcessing(false);
    }
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow">
        <p className="text-aviation-muted">
          Loading RFQ...
        </p>
      </div>
    );
  }

  /* ==========================================================
     NOT FOUND
  ========================================================== */

  if (!rfq) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow">
        <h2 className="text-2xl font-bold text-aviation-primary">
          RFQ Not Found
        </h2>

        <p className="mt-2 text-aviation-muted">
          The requested RFQ could not be found.
        </p>

        <Link
          href="/buyer/rfqs"
          className="mt-6 inline-flex rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white transition hover:bg-aviation-primary"
        >
          Back to RFQs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ======================================================
         BACK TO RFQs
      ====================================================== */}

      <Link
        href="/buyer/rfqs"
        className="inline-flex text-aviation-primary hover:underline"
      >
        ← Back to RFQs
      </Link>

      {/* ======================================================
         HEADER
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h1 className="text-4xl font-bold text-aviation-primary">
              {rfq.part?.part_number ??
                rfq.part_number ??
                "Custom RFQ"}
            </h1>

            <p className="mt-3 text-aviation-muted">
              RFQ #{rfq.id.slice(0, 8).toUpperCase()}
            </p>

            <p className="mt-1 text-sm text-aviation-muted">
              Created {formatDate(rfq.created_at)}
            </p>
          </div>

          <RFQStatusBadge status={rfq.status} />

        </div>

      </section>

      {/* ======================================================
         RFQ SUMMARY
      ====================================================== */}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          title="Quantity"
          value={rfq.quantity.toLocaleString()}
        />

        <SummaryCard
          title="Required Date"
          value={formatDate(rfq.required_date)}
        />

        <SummaryCard
          title="Distribution"
          value={
            rfq.distribution_method === "broadcast"
              ? "All Qualified Suppliers"
              : "Selected Suppliers"
          }
        />

        <SummaryCard
          title="Quotations"
          value={quotes.length.toString()}
        />

      </section>

      {/* ======================================================
         TECHNICAL REQUIREMENTS
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-8 text-2xl font-bold text-aviation-primary">
          Technical Requirements
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          <Detail
            title="Part Number"
            value={
              rfq.part?.part_number ??
              rfq.part_number
            }
          />

          <Detail
            title="Description"
            value={
              rfq.part?.description ??
              rfq.description
            }
          />

          <Detail
            title="ATA Chapter"
            value={rfq.ata_chapter}
          />

          <Detail
            title="Category"
            value={rfq.category}
          />

          <Detail
            title="Aircraft Manufacturer"
            value={rfq.aircraft_manufacturer}
          />

          <Detail
            title="Aircraft Model"
            value={rfq.aircraft_model}
          />

          <Detail
            title="Engine Manufacturer"
            value={rfq.engine_manufacturer}
          />

          <Detail
            title="Engine Model"
            value={rfq.engine_model}
          />

          <Detail
            title="Preferred Condition"
            value={rfq.preferred_condition}
          />

          <Detail
            title="Certification Required"
            value={rfq.certification_required}
          />

          <Detail
            title="Delivery Location"
            value={rfq.delivery_location}
          />

        </div>

      </section>

      {/* ======================================================
         ADDITIONAL NOTES
      ====================================================== */}

      {rfq.notes && (
        <section className="rounded-2xl bg-white p-8 shadow">

          <h2 className="mb-6 text-2xl font-bold text-aviation-primary">
            Additional Notes
          </h2>

          <p className="whitespace-pre-line leading-8 text-aviation-dark">
            {rfq.notes}
          </p>

        </section>
      )}

      {/* ======================================================
         SELECTED SUPPLIERS
      ====================================================== */}

      {rfq.distribution_method === "selected" &&
        (rfq.supplier_ids ?? []).length > 0 && (

        <section className="rounded-2xl bg-white p-8 shadow">

          <h2 className="mb-6 text-2xl font-bold text-aviation-primary">
            Invited Suppliers
          </h2>

          <div className="flex flex-wrap gap-3">

            {(rfq.supplier_ids ?? []).map((supplierId) => (
              <span
                key={supplierId}
                className="rounded-full bg-aviation-light px-4 py-2 text-sm text-aviation-dark"
              >
                {supplierId}
              </span>
            ))}

          </div>

        </section>
      )}

      {/* ======================================================
         ATTACHMENTS
      ====================================================== */}

      {(rfq.attachments ?? []).length > 0 && (

        <section className="rounded-2xl bg-white p-8 shadow">

          <h2 className="mb-6 text-2xl font-bold text-aviation-primary">
            Attachments
          </h2>

          <div className="space-y-3">

            {(rfq.attachments ?? []).map((attachment, index) => (
              <a
                key={attachment}
                href={attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border p-4 transition hover:bg-aviation-light"
              >
                <span className="font-medium">
                  Attachment {index + 1}
                </span>

                <span className="text-sm text-aviation-primary">
                  View →
                </span>
              </a>
            ))}

          </div>

        </section>
      )}

      {/* ======================================================
         RFQ TIMELINE
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-8 text-2xl font-bold text-aviation-primary">
          RFQ Timeline
        </h2>

        <RFQTimeline rfq={rfq} />

      </section>

      {/* ======================================================
         SUPPLIER QUOTATIONS
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <div className="mb-8">

          <h2 className="text-2xl font-bold text-aviation-primary">
            Supplier Quotations
          </h2>

          <p className="mt-2 text-aviation-muted">
            {quotes.length} quotation
            {quotes.length !== 1 ? "s" : ""} received
          </p>

        </div>

        {quotes.length === 0 ? (

          <div className="rounded-xl border border-dashed p-12 text-center">

            <h3 className="text-xl font-semibold text-aviation-dark">
              No Quotations Yet
            </h3>

            <p className="mt-3 text-aviation-muted">
              Suppliers have not submitted any
              quotations for this RFQ.
            </p>

          </div>

        ) : (

          <QuoteComparisonTable
            quotes={quotes}
          />

        )}

      </section>

      {/* ======================================================
         SUPPLIER COMMUNICATION
      ====================================================== */}

      {quotes.length > 0 && (

        <section className="rounded-2xl bg-white p-8 shadow">

          <div className="mb-8">

            <h2 className="text-2xl font-bold text-aviation-primary">
              Supplier Communication
            </h2>

            <p className="mt-2 text-aviation-muted">
              Communicate directly with a supplier
              regarding this RFQ.
            </p>

          </div>

          <div className="space-y-8">

            {quotes.map((quote) => {

              const supplierId =
                quote.supplier_id;

              if (!supplierId) {
                return null;
              }

              return (
                <div
                  key={quote.id}
                  className="rounded-2xl border bg-aviation-light p-6"
                >

                  <div className="mb-6">

                    <h3 className="text-lg font-bold text-aviation-primary">
                      {quote.supplier?.company_name ??
                        "Supplier"}
                    </h3>

                    <p className="mt-1 text-sm text-aviation-muted">
                      Quote submitted for this RFQ
                    </p>

                  </div>

                  <BuyerRFQMessageThread
                    rfqId={rfq.id}
                    supplierId={supplierId}
                  />

                </div>
              );
            })}

          </div>

        </section>
      )}

      {/* ======================================================
         ACTIONS
      ====================================================== */}

      <section className="flex flex-wrap justify-end gap-4 pb-6">

        <Link
          href={`/buyer/rfqs/${rfq.id}/edit`}
          className="rounded-xl border px-6 py-3 font-semibold transition hover:bg-aviation-light"
        >
          Edit RFQ
        </Link>

        <button
          type="button"
          onClick={handleClose}
          disabled={
            processing ||
            rfq.status === "Closed" ||
            rfq.status === "Cancelled"
          }
          className="rounded-xl bg-aviation-warning px-6 py-3 font-semibold text-white transition hover:bg-aviation-warning disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? "Processing..." : "Close RFQ"}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={
            processing ||
            rfq.status === "Closed" ||
            rfq.status === "Cancelled"
          }
          className="rounded-xl bg-aviation-error px-6 py-3 font-semibold text-white transition hover:bg-aviation-error disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? "Processing..." : "Cancel RFQ"}
        </button>

      </section>

    </div>
  );
}

/* ==========================================================
   SUMMARY CARD
========================================================== */

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">

      <p className="text-sm text-aviation-muted">
        {title}
      </p>

      <p className="mt-3 text-2xl font-bold text-aviation-primary">
        {value}
      </p>

    </div>
  );
}

/* ==========================================================
   DETAIL
========================================================== */

function Detail({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-xl border p-5">

      <p className="text-sm text-aviation-muted">
        {title}
      </p>

      <p className="mt-2 font-medium text-aviation-dark">
        {value || "-"}
      </p>

    </div>
  );
}