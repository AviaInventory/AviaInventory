"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getRFQById,
  formatDate,
} from "@/lib/rfqs";

import type { RFQ } from "@/lib/rfqs";

import RFQStatusBadge from "./RFQStatusBadge";
import QuoteForm from "./QuoteForm";
import QuoteHistory from "./QuoteHistory";
import RFQMessageThread from "../messages/RFQMessageThread";

interface Props {
  rfqId: string;
}

export default function RFQDetails({
  rfqId,
}: Props) {
  const [rfq, setRFQ] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRFQ();
  }, [rfqId]);

  async function loadRFQ() {
    try {
      setLoading(true);

      const result = await getRFQById(rfqId);

      if (result.success && result.data) {
        setRFQ(result.data as RFQ);
      } else {
        setRFQ(null);
      }
    } catch (error) {
      console.error("GET RFQ ERROR:", error);
      setRFQ(null);
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
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
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <h2 className="text-2xl font-bold text-aviation-primary">
          RFQ Not Found
        </h2>

        <p className="mt-2 text-aviation-muted">
          The requested RFQ could not be found.
        </p>

        <Link
          href="/supplier/rfqs"
          className="mt-6 inline-flex rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white transition hover:bg-aviation-primary"
        >
          Back to RFQs
        </Link>
      </div>
    );
  }

  /* ==========================================================
     RFQ DETAILS
  ========================================================== */

  return (
    <div className="space-y-6">

      {/* ======================================================
         HEADER
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h2 className="text-3xl font-bold text-aviation-primary">
              RFQ #{rfq.id.slice(0, 8).toUpperCase()}
            </h2>

            <p className="mt-2 text-aviation-muted">
              Submitted by{" "}
              <span className="font-semibold">
                {rfq.buyer?.company_name ??
                  rfq.buyer?.full_name ??
                  "-"}
              </span>
            </p>

            <p className="mt-1 text-sm text-aviation-muted">
              Created {formatDate(rfq.created_at)}
            </p>

          </div>

          <RFQStatusBadge
            status={rfq.status}
          />

        </div>

      </section>

      {/* ======================================================
         BUYER INFORMATION
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h3 className="mb-6 text-2xl font-bold text-aviation-primary">
          Buyer Information
        </h3>

        <div className="grid gap-6 md:grid-cols-2">

          <Detail
            label="Company"
            value={rfq.buyer?.company_name}
          />

          <Detail
            label="Contact"
            value={rfq.buyer?.full_name}
          />

          <Detail
            label="Country"
            value={rfq.buyer?.country}
          />

          <Detail
            label="Quantity Required"
            value={String(rfq.quantity)}
          />

          <Detail
            label="Required Date"
            value={formatDate(rfq.required_date)}
          />

          <Detail
            label="Delivery Location"
            value={rfq.delivery_location}
          />

        </div>

      </section>

      {/* ======================================================
         GENERAL INFORMATION
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h3 className="mb-6 text-2xl font-bold text-aviation-primary">
          General Information
        </h3>

        <div className="grid gap-6 md:grid-cols-2">

          <Detail
            label="Part Number"
            value={rfq.part_number}
          />

          <Detail
            label="Preferred Condition"
            value={rfq.preferred_condition}
          />

          <Detail
            label="Certification Required"
            value={rfq.certification_required}
          />

          <Detail
            label="Distribution"
            value={
              rfq.distribution_method === "broadcast"
                ? "Broadcast to all qualified suppliers"
                : "Selected suppliers only"
            }
          />

        </div>

        <div className="mt-8">

          <h4 className="mb-2 text-lg font-semibold text-aviation-dark">
            Description
          </h4>

          <div className="rounded-xl border bg-aviation-light p-5 leading-7 text-aviation-dark">
            {rfq.description ||
              "No description provided."}
          </div>

        </div>

      </section>

      {/* ======================================================
         TECHNICAL SPECIFICATIONS
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h3 className="mb-6 text-2xl font-bold text-aviation-primary">
          Technical Specifications
        </h3>

        <div className="grid gap-6 md:grid-cols-2">

          <Detail
            label="ATA Chapter"
            value={rfq.ata_chapter}
          />

          <Detail
            label="Category"
            value={rfq.category}
          />

          <Detail
            label="Aircraft Manufacturer"
            value={rfq.aircraft_manufacturer}
          />

          <Detail
            label="Aircraft Model"
            value={rfq.aircraft_model}
          />

          <Detail
            label="Engine Manufacturer"
            value={rfq.engine_manufacturer}
          />

          <Detail
            label="Engine Model"
            value={rfq.engine_model}
          />

        </div>

      </section>

      {/* ======================================================
         SUPPORTING DOCUMENTS
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h3 className="mb-6 text-2xl font-bold text-aviation-primary">
          Supporting Documents
        </h3>

        {!rfq.attachments ||
        rfq.attachments.length === 0 ? (

          <div className="rounded-xl border border-dashed border-aviation-border bg-aviation-light p-8 text-center">

            <p className="font-medium text-aviation-muted">
              No attachments uploaded.
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {rfq.attachments.map(
              (attachment, index) => (

                <a
                  key={index}
                  href={attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border p-4 text-aviation-primary transition hover:bg-aviation-light hover:underline"
                >
                  Attachment {index + 1}
                </a>

              )
            )}

          </div>

        )}

      </section>

      {/* ======================================================
         ADDITIONAL NOTES
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h3 className="mb-4 text-2xl font-bold text-aviation-primary">
          Additional Notes
        </h3>

        <div className="rounded-xl border bg-aviation-light p-5 leading-7 text-aviation-dark">
          {rfq.notes ||
            "No additional notes provided."}
        </div>

      </section>

      {/* ======================================================
         MESSAGE BUYER
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <RFQMessageThread
          rfqId={rfq.id}
          buyerId={rfq.buyer_id}
        />

      </section>

      {/* ======================================================
         QUOTE FORM
      ====================================================== */}

      <QuoteForm
        rfq={rfq}
      />

      {/* ======================================================
         QUOTE HISTORY
      ====================================================== */}

      <QuoteHistory
        rfqId={rfq.id}
      />

      {/* ======================================================
         BACK TO RFQs
      ====================================================== */}

      <div className="pb-6">

        <Link
          href="/supplier/rfqs"
          className="inline-flex rounded-xl border border-aviation-border px-6 py-3 font-semibold text-aviation-primary transition hover:bg-aviation-primary hover:text-white"
        >
          ← Back to RFQs
        </Link>

      </div>

    </div>
  );
}

/* ==========================================================
   DETAIL FIELD
========================================================== */

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>

      <p className="text-sm font-medium text-aviation-muted">
        {label}
      </p>

      <p className="mt-2 min-h-[48px] rounded-lg border bg-aviation-light p-3 font-medium text-aviation-dark">
        {value || "-"}
      </p>

    </div>
  );
}