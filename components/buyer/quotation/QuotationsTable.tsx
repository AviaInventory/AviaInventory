"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getBuyerQuotes,
  type Quote,
} from "@/lib/rfqs";

import QuotationFilters from "./QuotationFilters";
import QuotationStatusBadge from "./QuotationStatusBadge";
import QuotationEmptyState from "./QuotationEmptyState";

const PAGE_SIZE = 10;

export default function QuotationsTable() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [page, setPage] = useState(1);

  useEffect(() => {
    loadQuotes();
  }, []);

  async function loadQuotes() {
    try {
      setLoading(true);

      const result = await getBuyerQuotes();

      if (result.success && result.data) {
        setQuotes(result.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const matchesSearch =
        quote.rfq?.part?.part_number
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||

        quote.supplier?.company_name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||

        false;

      const matchesStatus =
        statusFilter === "All" ||
        quote.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotes, search, statusFilter]);

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
    return <QuotationEmptyState />;
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow">

      <QuotationFilters
        search={search}
        setSearch={setSearch}
        status={statusFilter}
        setStatus={setStatusFilter}
      />

      <div className="aviation-table-wrap"><table className="min-w-full">

        <thead className="bg-aviation-light">

          <tr>

            <th className="px-6 py-4 text-left">
              Quote
            </th>

            <th className="px-6 py-4 text-left">
              Part Number
            </th>

            <th className="px-6 py-4 text-left">
              Supplier
            </th>

            <th className="px-6 py-4 text-left">
              Unit Price
            </th>

            <th className="px-6 py-4 text-left">
              Lead Time
            </th>

            <th className="px-6 py-4 text-left">
              Status
            </th>

            <th className="px-6 py-4 text-left">
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
                {quote.id.slice(0, 8).toUpperCase()}
              </td>

              <td className="px-6 py-4">
                {quote.rfq?.part?.part_number}
              </td>

              <td className="px-6 py-4">
                {quote.supplier?.company_name}
              </td>

              <td className="px-6 py-4 font-medium">
                {quote.currency}{" "}
                {quote.unit_price.toLocaleString()}
              </td>

              <td className="px-6 py-4">
                {quote.lead_time}
              </td>

              <td className="px-6 py-4">

                <QuotationStatusBadge
                  status={quote.status}
                />

              </td>

              <td className="px-6 py-4">

                <Link
                  href={`/buyer/quotations/${quote.id}`}
                  className="font-medium text-aviation-primary hover:underline"
                >
                  View
                </Link>

              </td>

            </tr>

          ))}

        </tbody>

      </table></div>

      {totalPages > 1 && (

        <div className="flex items-center justify-between border-t bg-aviation-light px-6 py-4">

          <button
            disabled={page === 1}
            onClick={() =>
              setPage((prev) => prev - 1)
            }
            className="rounded-lg border px-4 py-2 disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm text-aviation-muted">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() =>
              setPage((prev) => prev + 1)
            }
            className="rounded-lg border px-4 py-2 disabled:opacity-40"
          >
            Next
          </button>

        </div>

      )}

    </div>
  );
}