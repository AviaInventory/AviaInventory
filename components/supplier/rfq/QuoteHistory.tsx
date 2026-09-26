"use client";

import { useEffect, useState } from "react";

import {
  getQuotesForRFQ,
  formatCurrency,
  formatDate,
} from "@/lib/rfqs";

import type {
  Quote,
} from "@/lib/rfqs";

interface Props {
  rfqId: string;
}

export default function QuoteHistory({
  rfqId,
}: Props) {

  const [quotes, setQuotes] =
    useState<Quote[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadQuotes();
  }, [rfqId]);

  async function loadQuotes() {

    try {

      setLoading(true);

      const data =
        await getQuotesForRFQ(rfqId);

      setQuotes(data);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }

  }

  if (loading) {
    return (
      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-6 text-2xl font-bold text-aviation-primary">
          Quotation History
        </h2>

        <p className="text-aviation-muted">
          Loading quotation history...
        </p>

      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-8 shadow">

      <h2 className="mb-6 text-2xl font-bold text-aviation-primary">
        Quotation History
      </h2>

      {quotes.length === 0 ? (

        <div className="rounded-xl border border-dashed border-aviation-border p-10 text-center text-aviation-muted">
          No quotations have been submitted yet.
        </div>

      ) : (

        <div className="overflow-x-auto">

          <div className="aviation-table-wrap"><table className="min-w-full">

            <thead className="border-b bg-aviation-light">

              <tr>

                <th className="px-4 py-3 text-left">
                  Supplier
                </th>

                <th className="px-4 py-3 text-left">
                  Submitted
                </th>

                <th className="px-4 py-3 text-left">
                  Price
                </th>

                <th className="px-4 py-3 text-left">
                  Lead Time
                </th>

                <th className="px-4 py-3 text-left">
                  Condition
                </th>

                <th className="px-4 py-3 text-left">
                  Warranty
                </th>

                <th className="px-4 py-3 text-left">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {quotes.map((quote) => (

                <tr
                  key={quote.id}
                  className="border-b hover:bg-aviation-light"
                >

                  <td className="px-4 py-4">
                    {quote.supplier?.company_name ?? "-"}
                  </td>

                  <td className="px-4 py-4">
                    {formatDate(
                      quote.created_at
                    )}
                  </td>

                  <td className="px-4 py-4 font-semibold">
                    {formatCurrency(
                      quote.unit_price,
                      quote.currency
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {quote.lead_time}
                  </td>

                  <td className="px-4 py-4">
                    {quote.condition}
                  </td>

                  <td className="px-4 py-4">
                    {quote.warranty || "-"}
                  </td>

                  <td className="px-4 py-4">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold
                        ${
                          quote.status === "Accepted"
                            ? "bg-aviation-success-soft text-aviation-success"
                            : quote.status === "Rejected"
                            ? "bg-aviation-error-soft text-aviation-error"
                            : quote.status === "Sent"
                            ? "bg-aviation-success-soft text-aviation-success"
                            : quote.status === "Expired"
                            ? "bg-aviation-warning-soft text-aviation-warning"
                            : "bg-aviation-light text-aviation-dark"
                        }`}
                    >
                      {quote.status}
                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table></div>

        </div>

      )}

    </section>
  );
}