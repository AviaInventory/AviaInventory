"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Archive, CalendarClock, CheckCircle2, FileText, TimerOff } from "lucide-react";
import ScrollToHash from "@/components/common/ScrollToHash";
import RFQAttachmentList from "@/components/rfq/RFQAttachmentList";

import {
  getRFQById,
  getSupplierQuotes,
  supplierRFQStatus,
  RFQStatus,
  formatDate,
} from "@/lib/rfqs";

import type { Quote, RFQ } from "@/lib/rfqs";

import RFQStatusBadge from "./RFQStatusBadge";
import RFQTypeBadge from "./RFQTypeBadge";
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
  const [myQuote, setMyQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRFQ();
  }, [rfqId]);

  async function loadRFQ() {
    try {
      setLoading(true);

      const [result, quotes] = await Promise.all([
        getRFQById(rfqId),
        getSupplierQuotes(),
      ]);

      if (result.success && result.data) {
        setRFQ(result.data as RFQ);
        setMyQuote(quotes.find((quote) => quote.rfq_id === rfqId) ?? null);
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

  const isMRO = rfq.rfq_type === "mro";
  const status = supplierRFQStatus(rfq, myQuote);

  /* ==========================================================
     RFQ DETAILS
  ========================================================== */

  return (
    <div className="space-y-6">
      <ScrollToHash />

      {/* ======================================================
         HEADER
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-bold text-aviation-primary">
                RFQ #{rfq.id.slice(0, 8).toUpperCase()}
              </h2>
              <RFQTypeBadge type={rfq.rfq_type} />
            </div>

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

          <div className="flex flex-col items-start gap-3 lg:items-end">

            <RFQStatusBadge
              status={status}
            />

            <div className="flex items-center gap-3 rounded-xl border border-aviation-border bg-aviation-light px-4 py-3">
              <CalendarClock size={20} className="shrink-0 text-aviation-primary" aria-hidden="true" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-aviation-muted">
                  Required by
                </p>
                <p className="font-bold text-aviation-dark">
                  {formatDate(rfq.required_date)}
                </p>
              </div>
            </div>

          </div>

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
            label={isMRO ? "Date Required" : "Required Date"}
            value={formatDate(rfq.required_date)}
          />

          {!isMRO && (
            <Detail
              label="Delivery Location"
              value={rfq.delivery_location}
            />
          )}

        </div>

      </section>

      {isMRO ? (

        /* ======================================================
           MRO SERVICE REQUIREMENT
        ====================================================== */

        <section className="rounded-2xl bg-white p-8 shadow">

          <h3 className="mb-2 text-2xl font-bold text-aviation-primary">
            Repair / Overhaul Requirement
          </h3>

          <p className="mb-6 text-sm text-aviation-muted">
            The buyer is requesting MRO services for the component below.
          </p>

          <div className="grid gap-6 md:grid-cols-2">

            <Detail
              label="Component"
              value={rfq.component}
            />

            <Detail
              label="Part Number"
              value={rfq.part_number}
            />

            <Detail
              label="Component Manufacturer"
              value={rfq.component_manufacturer}
            />

            <Detail
              label="Aircraft Model"
              value={rfq.aircraft_model}
            />

            <Detail
              label="Quantity"
              value={String(rfq.quantity)}
            />

            <Detail
              label="Forward Exchange Option"
              value={rfq.forward_exchange}
            />

            <Detail
              label="Date Required"
              value={formatDate(rfq.required_date)}
            />

          </div>

          <div className="mt-8">

            <h4 className="mb-2 text-lg font-semibold text-aviation-dark">
              Description / Scope of Repair
            </h4>

            <div className="whitespace-pre-line rounded-xl border bg-aviation-light p-5 leading-7 text-aviation-dark">
              {rfq.description ||
                "No description provided."}
            </div>

          </div>

        </section>

      ) : (

        <>

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

              <div className="whitespace-pre-line rounded-xl border bg-aviation-light p-5 leading-7 text-aviation-dark">
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

        </>

      )}

      {/* ======================================================
         SUPPORTING DOCUMENTS
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h3 className="mb-6 text-2xl font-bold text-aviation-primary">
          {isMRO ? "Photos & Documents" : "Supporting Documents"}
        </h3>

        <RFQAttachmentList
          paths={rfq.attachment_urls}
          emptyText="No attachments uploaded."
        />

      </section>

      {/* ======================================================
         ADDITIONAL NOTES
      ====================================================== */}

      {!isMRO && (
        <section className="rounded-2xl bg-white p-8 shadow">

          <h3 className="mb-4 text-2xl font-bold text-aviation-primary">
            Additional Notes
          </h3>

          <div className="whitespace-pre-line rounded-xl border bg-aviation-light p-5 leading-7 text-aviation-dark">
            {rfq.notes ||
              "No additional notes provided."}
          </div>

        </section>
      )}

      {/* ======================================================
         MESSAGE BUYER
      ====================================================== */}

      <section id="buyer-conversation" className="scroll-mt-28 rounded-2xl bg-white p-8 shadow">

        <RFQMessageThread
          rfqId={rfq.id}
          buyerId={rfq.buyer_id}
        />

      </section>

      {/* ======================================================
         QUOTE FORM — only while the RFQ is Pending for this supplier
      ====================================================== */}

      {status === RFQStatus.Pending ? (
        <QuoteForm
          rfq={rfq}
        />
      ) : (
        <QuoteUnavailableNotice
          status={status}
          rfq={rfq}
          myQuote={myQuote}
        />
      )}

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
   WHY THIS RFQ CAN'T BE QUOTED
   Keeps the #submit-quote anchor so notification links still land here.
========================================================== */

function QuoteUnavailableNotice({
  status,
  rfq,
  myQuote,
}: {
  status: RFQStatus;
  rfq: RFQ;
  myQuote: Quote | null;
}) {
  const notice =
    status === RFQStatus.Accepted
      ? { Icon: CheckCircle2, tone: "border-aviation-success/30 bg-aviation-success-soft text-aviation-success", title: "Your quotation was accepted", text: "The buyer accepted your quotation. Follow the order from Purchase Orders." }
      : status === RFQStatus.Quoted
      ? { Icon: FileText, tone: "border-aviation-primary/20 bg-aviation-primary/10 text-aviation-primary", title: "You have already quoted on this RFQ", text: "Your quotation has been sent to the buyer. Sent quotations can't be changed." }
      : status === RFQStatus.Expired
      ? { Icon: TimerOff, tone: "border-aviation-warning/30 bg-aviation-warning-soft text-aviation-warning", title: "This RFQ has expired", text: `Its required-by date (${formatDate(rfq.required_date)}) has been reached, so it no longer accepts quotations.` }
      : { Icon: Archive, tone: "border-aviation-border bg-aviation-light text-aviation-muted", title: "The buyer has closed this RFQ", text: "This RFQ no longer accepts quotations." };

  const Icon = notice.Icon;

  return (
    <section id="submit-quote" className={`scroll-mt-28 rounded-2xl border p-6 sm:p-8 ${notice.tone}`}>

      <div className="flex items-start gap-4">

        <Icon size={24} className="mt-0.5 shrink-0" aria-hidden="true" />

        <div className="min-w-0">

          <h2 className="text-xl font-bold">
            {notice.title}
          </h2>

          <p className="mt-1 text-sm text-aviation-dark">
            {notice.text}
          </p>

          {myQuote && (
            <Link
              href={`/supplier/quotes/${myQuote.id}`}
              className="mt-4 inline-flex rounded-xl bg-aviation-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-aviation-primary"
            >
              View my quotation
            </Link>
          )}

        </div>

      </div>

    </section>
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
