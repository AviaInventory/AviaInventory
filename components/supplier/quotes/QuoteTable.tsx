"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getSupplierQuotes,
  formatCurrency,
  formatDate,
  type Quote,
} from "@/lib/rfqs";

import QuoteFilters from "./QuoteFilters";
import QuoteStatusBadge from "./QuoteStatusBadge";
import QuoteEmptyState from "./QuoteEmptyState";

const PAGE_SIZE = 10;

export default function QuoteTable() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    Quote["status"] | "All"
  >("All");

  const [page, setPage] = useState(1);

  useEffect(() => {
    loadQuotes();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  async function loadQuotes() {
    try {
      setLoading(true);

      const data = await getSupplierQuotes();

      setQuotes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const text = search.toLowerCase();

      const matchesSearch =
        quote.rfq?.part_number
          ?.toLowerCase()
          .includes(text) ||
        quote.rfq?.description
          ?.toLowerCase()
          .includes(text) ||
        false;

      const matchesStatus =
        status === "All" ||
        quote.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [quotes, search, status]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredQuotes.length / PAGE_SIZE)
  );

  const paginatedQuotes = filteredQuotes.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow">
        Loading quotations...
      </div>
    );
  }

  if (!filteredQuotes.length) {
    return <QuoteEmptyState />;
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow">

      <QuoteFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={(value) => setStatus(value as Quote["status"] | "All")}
      />

      <div className="overflow-x-auto">

        <div className="aviation-table-wrap"><table className="min-w-full">

          <thead className="bg-aviation-light">

            <tr>

              <th className="px-6 py-4 text-left font-semibold">
                RFQ
              </th>

              <th className="px-6 py-4 text-left font-semibold">
                Part Number
              </th>

              <th className="px-6 py-4 text-left font-semibold">
                Price
              </th>

              <th className="px-6 py-4 text-left font-semibold">
                Lead Time
              </th>

              <th className="px-6 py-4 text-left font-semibold">
                Submitted
              </th>

              <th className="px-6 py-4 text-left font-semibold">
                Status
              </th>

              <th className="px-6 py-4 text-left font-semibold">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {paginatedQuotes.map((quote) => (

              <tr
                key={quote.id}
                className="border-b hover:bg-aviation-light"
              >

                <td className="px-6 py-4 font-medium">
                  {quote.rfq_id.slice(0, 8).toUpperCase()}
                </td>

                <td className="px-6 py-4">
                  {quote.rfq?.part_number ?? "-"}
                </td>

                <td className="px-6 py-4">
                  {formatCurrency(
                    quote.unit_price,
                    quote.currency
                  )}
                </td>

                <td className="px-6 py-4">
                  {quote.lead_time}
                </td>

                <td className="px-6 py-4">
                  {formatDate(quote.created_at)}
                </td>

                <td className="px-6 py-4">
                  <QuoteStatusBadge status={quote.status} />
                </td>

                <td className="px-6 py-4">

                  <Link
                    href={`/supplier/rfqs/${quote.rfq_id}`}
                    className="font-medium text-aviation-primary hover:underline"
                  >
                    View
                  </Link>

                </td>

              </tr>

            ))}

          </tbody>

        </table></div>

      </div>

      {totalPages > 1 && (

        <div className="flex items-center justify-between border-t px-6 py-4">

          <p className="text-sm text-aviation-muted">
            Showing {paginatedQuotes.length} of {filteredQuotes.length}
          </p>

          <div className="flex items-center gap-2">

            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="rounded-lg border px-4 py-2 disabled:opacity-40"
            >
              Previous
            </button>

            <span className="rounded-lg border px-4 py-2">
              {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="rounded-lg border px-4 py-2 disabled:opacity-40"
            >
              Next
            </button>

          </div>

        </div>

      )}

    </div>
  );
}
