"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  acceptQuote,
  rejectQuote,
  getQuotesForRFQ,
  formatCurrency,
  formatDate,
} from "@/lib/rfqs";

import type { Quote } from "@/lib/rfqs";

interface Props {
  quotes: Quote[];
}

export default function QuoteComparisonTable({
  quotes,
}: Props) {
  const router = useRouter();

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [localQuotes, setLocalQuotes] =
    useState<Quote[]>(quotes);

  /* ==========================================================
     ACCEPT QUOTE
     
     Flow:

     Buyer clicks Accept
            ↓
     acceptQuote()
            ↓
     Supabase accept_quote()
            ↓
     Create order
            ↓
     Accept quote
            ↓
     Close RFQ
            ↓
     Return order UUID
            ↓
     Open order details
  ========================================================== */

  async function handleAccept(
    quoteId: string
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to accept this quotation?\n\nAccepting the quotation will create an order."
    );

    if (!confirmed) {
      return;
    }

    /* Prevent multiple simultaneous actions */

    if (processingId !== null) {
      return;
    }

    setProcessingId(quoteId);

    try {
      /* ======================================================
         FIND SELECTED QUOTE
      ====================================================== */

      const selectedQuote =
        localQuotes.find(
          (quote) => quote.id === quoteId
        );

      if (!selectedQuote) {
        alert(
          "Quotation could not be found."
        );

        return;
      }

      /* ======================================================
         CHECK QUOTE STATUS
      ====================================================== */

      if (selectedQuote.status !== "Sent") {
        alert(
          `This quotation cannot be accepted because its current status is "${selectedQuote.status}".`
        );

        return;
      }

      /* ======================================================
         ACCEPT QUOTE

         The Supabase RPC:

         accept_quote(p_quote_id)

         should:

         1. Verify the buyer
         2. Verify the quote
         3. Create the order
         4. Mark quote as Accepted
         5. Close the RFQ
         6. Return the new order UUID
      ====================================================== */

      const result =
        await acceptQuote(quoteId);

      /* ======================================================
         HANDLE ERROR
      ====================================================== */

      if (!result.success) {
        console.error(
          "ACCEPT QUOTE ERROR:",
          result.error
        );

        alert(
          typeof result.error === "string"
            ? result.error
            : "Unable to accept the quotation."
        );

        return;
      }

      /* ======================================================
         GET ORDER ID

         Your accept_quote() function returns:

         v_order_id uuid
      ====================================================== */

      const orderId =
        typeof result.data === "string"
          ? result.data
          : null;

      console.log(
        "ACCEPTED QUOTE:",
        quoteId
      );

      console.log(
        "CREATED ORDER ID:",
        orderId
      );

      /* ======================================================
         REFRESH QUOTES

         This makes sure the quote table reflects:

         Accepted
         Rejected
         RFQ Closed
      ====================================================== */

      const refreshedQuotes =
        await getQuotesForRFQ(
          selectedQuote.rfq_id
        );

      setLocalQuotes(
        refreshedQuotes
      );

      /* ======================================================
         ORDER CREATED SUCCESSFULLY
      ====================================================== */

      if (orderId) {
        alert(
          "Quotation accepted successfully.\n\nYour order has been created."
        );

        /*
         * Go directly to the new order.
         */

        router.push(
          `/buyer/orders/${orderId}`
        );

        router.refresh();

        return;
      }

      /* ======================================================
         FALLBACK
         
         The quote was accepted but the RPC
         did not return the order UUID.
      ====================================================== */

      console.warn(
        "Quote accepted but no order ID was returned."
      );

      alert(
        "Quotation accepted successfully.\n\nYour order has been created."
      );

      router.push(
        "/buyer/orders"
      );

      router.refresh();

    } catch (error) {
      console.error(
        "ACCEPT QUOTE TABLE ERROR:",
        error
      );

      alert(
        "Something went wrong while accepting the quotation."
      );

    } finally {
      setProcessingId(null);
    }
  }

  /* ==========================================================
     REJECT QUOTE
  ========================================================== */

  async function handleReject(
    quoteId: string
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to reject this quotation?"
    );

    if (!confirmed) {
      return;
    }

    /* Prevent multiple actions */

    if (processingId !== null) {
      return;
    }

    setProcessingId(quoteId);

    try {
      /* ======================================================
         FIND SELECTED QUOTE
      ====================================================== */

      const selectedQuote =
        localQuotes.find(
          (quote) => quote.id === quoteId
        );

      if (!selectedQuote) {
        alert(
          "Quotation could not be found."
        );

        return;
      }

      /* ======================================================
         CHECK STATUS
      ====================================================== */

      if (selectedQuote.status !== "Sent") {
        alert(
          `This quotation cannot be rejected because its current status is "${selectedQuote.status}".`
        );

        return;
      }

      /* ======================================================
         REJECT QUOTE
      ====================================================== */

      const result =
        await rejectQuote(quoteId);

      if (!result.success) {
        console.error(
          "REJECT QUOTE ERROR:",
          result.error
        );

        alert(
          typeof result.error === "string"
            ? result.error
            : "Unable to reject the quotation."
        );

        return;
      }

      /* ======================================================
         REFRESH QUOTES
      ====================================================== */

      const refreshedQuotes =
        await getQuotesForRFQ(
          selectedQuote.rfq_id
        );

      setLocalQuotes(
        refreshedQuotes
      );

      /* ======================================================
         SUCCESS
      ====================================================== */

      alert(
        "Quotation rejected successfully."
      );

    } catch (error) {
      console.error(
        "REJECT QUOTE TABLE ERROR:",
        error
      );

      alert(
        "Something went wrong while rejecting the quotation."
      );

    } finally {
      setProcessingId(null);
    }
  }

  /* ==========================================================
     NO QUOTATIONS
  ========================================================== */

  if (!localQuotes.length) {
    return (
      <div className="rounded-xl border border-dashed border-aviation-border p-10 text-center">

        <p className="font-medium text-aviation-dark">
          No quotations available.
        </p>

        <p className="mt-2 text-sm text-aviation-muted">
          Supplier quotations will appear here once
          they respond to this RFQ.
        </p>

      </div>
    );
  }

  /* ==========================================================
     MAIN
  ========================================================== */

  return (
    <div className="space-y-6">

      {/* ======================================================
          DESKTOP TABLE
      ====================================================== */}

      <div className="hidden overflow-x-auto rounded-xl border md:block">

        <div className="aviation-table-wrap"><table className="min-w-full">

          <thead className="bg-aviation-light">

            <tr>

              <th className="px-5 py-4 text-left text-sm font-semibold text-aviation-dark">
                Supplier
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold text-aviation-dark">
                Price
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold text-aviation-dark">
                Condition
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold text-aviation-dark">
                Lead Time
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold text-aviation-dark">
                Certification
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold text-aviation-dark">
                Valid Until
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold text-aviation-dark">
                Status
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold text-aviation-dark">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {localQuotes.map(
              (quote) => {

                const isProcessing =
                  processingId === quote.id;

                const anotherQuoteProcessing =
                  processingId !== null &&
                  processingId !== quote.id;

                return (
                  <tr
                    key={quote.id}
                    className="border-t transition hover:bg-aviation-light"
                  >

                    {/* ==================================================
                       SUPPLIER
                    ================================================== */}

                    <td className="px-5 py-5">

                      <div>

                        <p className="font-semibold text-aviation-dark">
                          {quote.supplier
                            ?.company_name ||
                            "Supplier"}
                        </p>

                        <p className="mt-1 text-sm text-aviation-muted">
                          {quote.supplier
                            ?.country ||
                            "-"}
                        </p>

                      </div>

                    </td>

                    {/* ==================================================
                       PRICE
                    ================================================== */}

                    <td className="px-5 py-5 font-semibold text-aviation-primary">

                      {formatCurrency(
                        quote.unit_price,
                        quote.currency
                      )}

                    </td>

                    {/* ==================================================
                       CONDITION
                    ================================================== */}

                    <td className="px-5 py-5">

                      {quote.condition ||
                        "-"}

                    </td>

                    {/* ==================================================
                       LEAD TIME
                    ================================================== */}

                    <td className="px-5 py-5">

                      {quote.lead_time ||
                        "-"}

                    </td>

                    {/* ==================================================
                       CERTIFICATION
                    ================================================== */}

                    <td className="px-5 py-5">

                      {quote.certification
                        ?.length
                        ? quote.certification.join(
                            ", "
                          )
                        : "-"}

                    </td>

                    {/* ==================================================
                       VALID UNTIL
                    ================================================== */}

                    <td className="px-5 py-5">

                      {formatDate(
                        quote.valid_until
                      )}

                    </td>

                    {/* ==================================================
                       STATUS
                    ================================================== */}

                    <td className="px-5 py-5">

                      <StatusBadge
                        status={
                          quote.status
                        }
                      />

                    </td>

                    {/* ==================================================
                       ACTION
                    ================================================== */}

                    <td className="px-5 py-5">

                      <div className="flex flex-col gap-2">

                        {/* ACCEPT / REJECT */}

                        {quote.status ===
                          "Sent" && (
                          <>

                            <button
                              type="button"
                              disabled={
                                processingId !==
                                  null ||
                                anotherQuoteProcessing
                              }
                              onClick={() =>
                                handleAccept(
                                  quote.id
                                )
                              }
                              className="rounded-lg bg-aviation-success px-4 py-2 text-sm font-semibold text-white transition hover:bg-aviation-success disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing
                                ? "Creating Order..."
                                : "Accept"}
                            </button>

                            <button
                              type="button"
                              disabled={
                                processingId !==
                                  null ||
                                anotherQuoteProcessing
                              }
                              onClick={() =>
                                handleReject(
                                  quote.id
                                )
                              }
                              className="rounded-lg border border-aviation-border px-4 py-2 text-sm font-semibold text-aviation-error transition hover:bg-aviation-error-soft disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing
                                ? "Processing..."
                                : "Reject"}
                            </button>

                          </>
                        )}

                        {/* ACCEPTED */}

                        {quote.status ===
                          "Accepted" && (
                          <span className="text-sm font-semibold text-aviation-success">
                            Accepted
                          </span>
                        )}

                        {/* REJECTED */}

                        {quote.status ===
                          "Rejected" && (
                          <span className="text-sm font-semibold text-aviation-error">
                            Rejected
                          </span>
                        )}

                        {/* EXPIRED */}

                        {quote.status ===
                          "Expired" && (
                          <span className="text-sm font-semibold text-aviation-warning">
                            Expired
                          </span>
                        )}

                      </div>

                    </td>

                  </tr>
                );
              }
            )}

          </tbody>

        </table></div>

      </div>

      {/* ======================================================
          MOBILE CARDS
      ====================================================== */}

      <div className="space-y-4 md:hidden">

        {localQuotes.map(
          (quote) => {

            const isProcessing =
              processingId === quote.id;

            return (
              <div
                key={quote.id}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >

                {/* ==================================================
                   HEADER
                ================================================== */}

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <h3 className="font-bold text-aviation-primary">
                      {quote.supplier
                        ?.company_name ||
                        "Supplier"}
                    </h3>

                    <p className="mt-1 text-sm text-aviation-muted">
                      {quote.supplier
                        ?.country ||
                        "-"}
                    </p>

                  </div>

                  <StatusBadge
                    status={
                      quote.status
                    }
                  />

                </div>

                {/* ==================================================
                   DETAILS
                ================================================== */}

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <MobileDetail
                    label="Price"
                    value={formatCurrency(
                      quote.unit_price,
                      quote.currency
                    )}
                  />

                  <MobileDetail
                    label="Condition"
                    value={
                      quote.condition ||
                      "-"
                    }
                  />

                  <MobileDetail
                    label="Lead Time"
                    value={
                      quote.lead_time ||
                      "-"
                    }
                  />

                  <MobileDetail
                    label="Valid Until"
                    value={formatDate(
                      quote.valid_until
                    )}
                  />

                </div>

                {/* ==================================================
                   CERTIFICATION
                ================================================== */}

                {quote.certification
                  ?.length > 0 && (
                  <div className="mt-4">

                    <p className="text-xs font-medium uppercase tracking-wide text-aviation-muted">
                      Certification
                    </p>

                    <p className="mt-1 text-sm text-aviation-dark">
                      {quote.certification.join(
                        ", "
                      )}
                    </p>

                  </div>
                )}

                {/* ==================================================
                   MESSAGE
                ================================================== */}

                {quote.message && (
                  <div className="mt-4 rounded-lg bg-aviation-light p-4">

                    <p className="text-xs font-medium uppercase tracking-wide text-aviation-muted">
                      Supplier Message
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-aviation-dark">
                      {quote.message}
                    </p>

                  </div>
                )}

                {/* ==================================================
                   ACTIONS
                ================================================== */}

                {quote.status ===
                  "Sent" && (
                  <div className="mt-5 flex gap-3">

                    {/* ACCEPT */}

                    <button
                      type="button"
                      disabled={
                        processingId !== null
                      }
                      onClick={() =>
                        handleAccept(
                          quote.id
                        )
                      }
                      className="flex-1 rounded-lg bg-aviation-success px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-aviation-success disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing
                        ? "Creating Order..."
                        : "Accept"}
                    </button>

                    {/* REJECT */}

                    <button
                      type="button"
                      disabled={
                        processingId !== null
                      }
                      onClick={() =>
                        handleReject(
                          quote.id
                        )
                      }
                      className="flex-1 rounded-lg border border-aviation-border px-4 py-2.5 text-sm font-semibold text-aviation-error transition hover:bg-aviation-error-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing
                        ? "Processing..."
                        : "Reject"}
                    </button>

                  </div>
                )}

                {/* ==================================================
                   ACCEPTED
                ================================================== */}

                {quote.status ===
                  "Accepted" && (
                  <div className="mt-5 rounded-lg bg-aviation-success-soft px-4 py-3 text-center text-sm font-semibold text-aviation-success">

                    Quotation Accepted

                  </div>
                )}

                {/* ==================================================
                   REJECTED
                ================================================== */}

                {quote.status ===
                  "Rejected" && (
                  <div className="mt-5 rounded-lg bg-aviation-error-soft px-4 py-3 text-center text-sm font-semibold text-aviation-error">

                    Quotation Rejected

                  </div>
                )}

                {/* ==================================================
                   EXPIRED
                ================================================== */}

                {quote.status ===
                  "Expired" && (
                  <div className="mt-5 rounded-lg bg-aviation-warning-soft px-4 py-3 text-center text-sm font-semibold text-aviation-warning">

                    Quotation Expired

                  </div>
                )}

              </div>
            );
          }
        )}

      </div>

    </div>
  );
}

/* ==========================================================
   STATUS BADGE
========================================================== */

function StatusBadge({
  status,
}: {
  status: Quote["status"];
}) {
  const styles: Record<
    Quote["status"],
    string
  > = {
    Draft:
      "bg-aviation-light text-aviation-dark",

    Sent:
      "bg-aviation-success-soft text-aviation-success",

    Accepted:
      "bg-aviation-success-soft text-aviation-success",

    Rejected:
      "bg-aviation-error-soft text-aviation-error",

    Expired:
      "bg-aviation-warning-soft text-aviation-warning",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] ??
        "bg-aviation-light text-aviation-dark"
      }`}
    >
      {status}
    </span>
  );
}

/* ==========================================================
   MOBILE DETAIL
========================================================== */

function MobileDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-xs font-medium uppercase tracking-wide text-aviation-muted">
        {label}
      </p>

      <p className="mt-1 font-medium text-aviation-dark">
        {value}
      </p>

    </div>
  );
}