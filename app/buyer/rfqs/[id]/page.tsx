"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  getRFQById,
  getQuotesForRFQ,
  cancelRFQ,
  closeRFQ,
  formatDate,
  formatCurrency,
  type RFQ,
  type Quote,
  RFQStatus,
} from "@/lib/rfqs";

import RFQStatusBadge from "@/components/buyer/rfq/RFQStatusBadge";
import RFQMessageThread from "@/components/buyer/rfq/RFQMessageThread";

export default function BuyerRFQDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const rfqId = params.id as string;

  const [rfq, setRFQ] = useState<RFQ | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedSupplierId, setSelectedSupplierId] =
    useState<string | null>(null);

  useEffect(() => {
    if (!rfqId) return;

    loadRFQ();
  }, [rfqId]);

  async function loadRFQ() {
    try {
      setLoading(true);

      const [rfqResult, quoteData] = await Promise.all([
        getRFQById(rfqId),
        getQuotesForRFQ(rfqId),
      ]);

      if (!rfqResult.success || !rfqResult.data) {
        console.error(
          "Failed to load RFQ:",
          rfqResult.error
        );

        return;
      }

      setRFQ(rfqResult.data);
      setQuotes(quoteData);
    } catch (error) {
      console.error(
        "Failed to load RFQ details:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!rfq) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this RFQ?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      const result = await cancelRFQ(rfq.id);

      if (!result.success) {
        alert(
          typeof result.error === "string"
            ? result.error
            : "Unable to cancel the RFQ."
        );

        return;
      }

      await loadRFQ();
    } catch (error) {
      console.error(
        "Failed to cancel RFQ:",
        error
      );

      alert("Unable to cancel the RFQ.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClose() {
    if (!rfq) return;

    const confirmed = window.confirm(
      "Are you sure you want to close this RFQ?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      const result = await closeRFQ(rfq.id);

      if (!result.success) {
        alert(
          typeof result.error === "string"
            ? result.error
            : "Unable to close the RFQ."
        );

        return;
      }

      await loadRFQ();
    } catch (error) {
      console.error(
        "Failed to close RFQ:",
        error
      );

      alert("Unable to close the RFQ.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-aviation-muted">
          Loading RFQ...
        </p>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow">
        <h2 className="text-2xl font-bold text-aviation-primary">
          RFQ Not Found
        </h2>

        <p className="mt-2 text-aviation-muted">
          The requested RFQ could not be found.
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

  const canEdit =
    rfq.status === RFQStatus.Pending;

  const canCancel =
    rfq.status !== RFQStatus.Cancelled &&
    rfq.status !== RFQStatus.Closed;

  const canClose =
    rfq.status !== RFQStatus.Cancelled &&
    rfq.status !== RFQStatus.Closed;

  return (
    <div className="space-y-8">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div>
        <Link
          href="/buyer/rfqs"
          className="text-sm font-medium text-aviation-primary hover:underline"
        >
          ← Back to My RFQs
        </Link>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

          <div>
            <div className="flex flex-wrap items-center gap-4">

              <h1 className="text-4xl font-bold text-aviation-primary">
                RFQ #{rfq.id.slice(0, 8).toUpperCase()}
              </h1>

              <RFQStatusBadge
                status={rfq.status}
              />

            </div>

            <p className="mt-2 text-aviation-muted">
              Created on {formatDate(rfq.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            {canEdit && (
              <Link
                href={`/buyer/rfqs/${rfq.id}/edit`}
                className="rounded-xl border border-aviation-border px-5 py-3 font-semibold text-aviation-warning transition hover:bg-aviation-warning-soft"
              >
                Edit RFQ
              </Link>
            )}

            {canCancel && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCancel}
                className="rounded-xl border border-aviation-border px-5 py-3 font-semibold text-aviation-error transition hover:bg-aviation-error-soft disabled:opacity-50"
              >
                Cancel RFQ
              </button>
            )}

            {canClose && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleClose}
                className="rounded-xl bg-aviation-primary px-5 py-3 font-semibold text-white transition hover:bg-aviation-primary disabled:opacity-50"
              >
                Close RFQ
              </button>
            )}

          </div>
        </div>
      </div>

      {/* =====================================================
          PART INFORMATION
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="text-2xl font-bold text-aviation-primary">
          Part Information
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">

          <InfoItem
            label="Part Number"
            value={rfq.part_number}
          />

          <InfoItem
            label="Category"
            value={rfq.category}
          />

          <div className="md:col-span-2">
            <InfoItem
              label="Description"
              value={rfq.description}
            />
          </div>

          <InfoItem
            label="Preferred Condition"
            value={rfq.preferred_condition}
          />

          <InfoItem
            label="Certification Required"
            value={rfq.certification_required}
          />

          <InfoItem
            label="ATA Chapter"
            value={rfq.ata_chapter}
          />

        </div>
      </section>

      {/* =====================================================
          AIRCRAFT / ENGINE
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="text-2xl font-bold text-aviation-primary">
          Aircraft & Engine Information
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">

          <InfoItem
            label="Aircraft Manufacturer"
            value={rfq.aircraft_manufacturer}
          />

          <InfoItem
            label="Aircraft Model"
            value={rfq.aircraft_model}
          />

          <InfoItem
            label="Engine Manufacturer"
            value={rfq.engine_manufacturer}
          />

          <InfoItem
            label="Engine Model"
            value={rfq.engine_model}
          />

        </div>
      </section>

      {/* =====================================================
          REQUIREMENTS
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="text-2xl font-bold text-aviation-primary">
          Requirements
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">

          <InfoItem
            label="Quantity"
            value={String(rfq.quantity)}
          />

          <InfoItem
            label="Required Date"
            value={formatDate(rfq.required_date)}
          />

          <InfoItem
            label="Delivery Location"
            value={rfq.delivery_location}
          />

          <InfoItem
            label="Distribution"
            value={
              rfq.distribution_method ===
              "broadcast"
                ? "All Qualified Suppliers"
                : "Selected Suppliers"
            }
          />

        </div>

        {rfq.notes && (
          <div className="mt-6">
            <InfoItem
              label="Additional Notes"
              value={rfq.notes}
            />
          </div>
        )}

      </section>

      {/* =====================================================
          ATTACHMENTS
      ====================================================== */}

      {(() => {
        const attachments = rfq.attachments ?? [];

        return attachments.length > 0 && (
        <section className="rounded-2xl bg-white p-8 shadow">

          <h2 className="text-2xl font-bold text-aviation-primary">
            Attachments
          </h2>

          <div className="mt-6 space-y-3">

            {attachments.map(
              (url, index) => {

                const fileName =
                  decodeURIComponent(
                    url.split("/").pop() ||
                      `Attachment ${index + 1}`
                  );

                return (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border bg-aviation-light p-4 transition hover:bg-aviation-light"
                  >
                    <span className="font-medium text-aviation-dark">
                      {fileName}
                    </span>

                    <span className="text-sm font-semibold text-aviation-primary">
                      Open
                    </span>
                  </a>
                );
              }
            )}

          </div>
        </section>
      );
      })()}

      {/* =====================================================
          SUPPLIER QUOTATIONS
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="text-2xl font-bold text-aviation-primary">
              Supplier Quotations
            </h2>

            <p className="mt-1 text-sm text-aviation-muted">
              Review quotations submitted by suppliers.
            </p>
          </div>

          <div className="rounded-full bg-aviation-success-soft px-4 py-2 text-sm font-semibold text-aviation-primary">
            {quotes.length}{" "}
            {quotes.length === 1
              ? "Quote"
              : "Quotes"}
          </div>

        </div>

        {quotes.length === 0 ? (

          <div className="mt-6 rounded-xl border border-dashed border-aviation-border bg-aviation-light p-10 text-center">

            <p className="font-medium text-aviation-muted">
              No quotations received yet.
            </p>

            <p className="mt-1 text-sm text-aviation-muted">
              Suppliers will appear here once they submit quotations.
            </p>

          </div>

        ) : (

          <div className="mt-6 space-y-5">

            {quotes.map((quote) => (

              <div
                key={quote.id}
                className="rounded-2xl border border-aviation-border p-6"
              >

                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                  <div>

                    <h3 className="text-lg font-bold text-aviation-dark">
                      {quote.supplier?.company_name ??
                        "Supplier"}
                    </h3>

                    <p className="mt-1 text-sm text-aviation-muted">
                      {quote.supplier?.country ??
                        "-"}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-2xl font-bold text-aviation-primary">
                      {formatCurrency(
                        quote.unit_price,
                        quote.currency
                      )}
                    </p>

                    <p className="text-xs text-aviation-muted">
                      per unit
                    </p>

                  </div>

                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">

                  <InfoItem
                    label="Condition"
                    value={quote.condition}
                  />

                  <InfoItem
                    label="Lead Time"
                    value={quote.lead_time}
                  />

                  <InfoItem
                    label="Valid Until"
                    value={formatDate(
                      quote.valid_until
                    )}
                  />

                </div>

                {quote.message && (
                  <div className="mt-5 rounded-xl bg-aviation-light p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-aviation-muted">
                      Supplier Message
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-aviation-dark">
                      {quote.message}
                    </p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-3">

                  <Link
                    href={`/buyer/quotes/${quote.id}`}
                    className="rounded-xl bg-aviation-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-aviation-primary"
                  >
                    View Quote
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSupplierId(
                        quote.supplier_id
                      )
                    }
                    className="rounded-xl border border-aviation-border px-5 py-3 text-sm font-semibold text-aviation-primary transition hover:bg-aviation-success-soft"
                  >
                    Message Supplier
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

      {/* =====================================================
          MESSAGE SUPPLIER
      ====================================================== */}

      {selectedSupplierId && (
        <section className="rounded-2xl bg-white p-8 shadow">

          <div className="mb-5 flex items-center justify-between">

            <h2 className="text-2xl font-bold text-aviation-primary">
              Supplier Conversation
            </h2>

            <button
              type="button"
              onClick={() =>
                setSelectedSupplierId(null)
              }
              className="text-sm font-medium text-aviation-muted hover:text-aviation-dark"
            >
              Close
            </button>

          </div>

          <RFQMessageThread
            rfqId={rfq.id}
            supplierId={selectedSupplierId}
          />

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