"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getSupplierRFQs,
  getSupplierQuotes,
  supplierRFQStatus,
  RFQStatus,
  formatDate,
} from "@/lib/rfqs";

import type { Quote, RFQ } from "@/lib/rfqs";

import RFQFilters from "./RFQFilters";
import RFQStatusBadge from "./RFQStatusBadge";
import RFQEmptyState from "./RFQEmptyState";
import RFQTypeBadge from "./RFQTypeBadge";

const PAGE_SIZE = 10;

function TableSkeleton({
  rows = 6,
  columns = 7,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow">
      <div className="animate-pulse">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-6 border-b px-6 py-5">
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <div key={columnIndex} className="h-4 flex-1 rounded bg-gray-200" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RFQTable() {
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  // This supplier's own quotation per RFQ: decides the status they see and whether they can quote.
  const [myQuotes, setMyQuotes] = useState<Map<string, Quote>>(new Map());
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<RFQ["status"] | "All">("All");

  const [page, setPage] = useState(1);

  useEffect(() => {
    loadRFQs();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  async function loadRFQs() {
    try {
      setLoading(true);

      const [data, quotes] = await Promise.all([
        getSupplierRFQs(),
        getSupplierQuotes(),
      ]);

      setRFQs(data);
      setMyQuotes(new Map(quotes.map((quote) => [quote.rfq_id, quote])));

    } catch (error) {
      console.error("Failed to load RFQs:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredRFQs = useMemo(() => {
    const searchText = search.toLowerCase();

    return rfqs.filter((rfq) => {

      const matchesSearch =
        rfq.part?.part_number
          ?.toLowerCase()
          .includes(searchText) ||

        rfq.part_number
          ?.toLowerCase()
          .includes(searchText) ||

        rfq.component
          ?.toLowerCase()
          .includes(searchText) ||

        rfq.description
          ?.toLowerCase()
          .includes(searchText) ||

        rfq.buyer?.company_name
          ?.toLowerCase()
          .includes(searchText) ||

        false;

      const matchesStatus =
        statusFilter === "All" ||
        supplierRFQStatus(rfq, myQuotes.get(rfq.id)) === statusFilter;

      return matchesSearch && matchesStatus;
    });

  }, [rfqs, myQuotes, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRFQs.length / PAGE_SIZE)
  );

  const paginatedRFQs = filteredRFQs.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  if (loading) {
    return <div aria-busy="true" aria-label="Loading table"><TableSkeleton rows={6} columns={5} /></div>;
  }

  if (!filteredRFQs.length) {
    return <RFQEmptyState />;
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow">

      <RFQFilters
        search={search}
        setSearch={setSearch}
        status={statusFilter}
        setStatus={setStatusFilter}
      />

      <div className="overflow-x-auto">

        <div className="aviation-table-wrap"><table className="min-w-full">

          <thead className="bg-aviation-light">

            <tr>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                RFQ #
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Type
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Part Number
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Buyer
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Quantity
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Required By
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Status
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {paginatedRFQs.map((rfq) => {
              const myQuote = myQuotes.get(rfq.id);
              const status = supplierRFQStatus(rfq, myQuote);

              return (
              <tr
                key={rfq.id}
                className="border-b transition hover:bg-aviation-light"
              >

                <td className="px-6 py-4 font-medium">
                  {rfq.id.slice(0, 8).toUpperCase()}
                </td>

                <td className="px-6 py-4">
                  <RFQTypeBadge type={rfq.rfq_type} />
                </td>

                <td className="px-6 py-4">
                  {rfq.part?.part_number ?? rfq.part_number ?? "-"}
                  {rfq.rfq_type === "mro" && rfq.component && (
                    <span className="block text-xs text-aviation-muted">{rfq.component}</span>
                  )}
                </td>

                <td className="px-6 py-4">
                  {rfq.buyer?.company_name ?? "-"}
                </td>

                <td className="px-6 py-4">
                  {rfq.quantity}
                </td>

                <td className="px-6 py-4">
                  {formatDate(rfq.required_date)}
                </td>

                <td className="px-6 py-4">
                  <RFQStatusBadge
                    status={status}
                  />
                </td>

                <td className="px-6 py-4">

                  <div className="flex items-center gap-4">

                    <Link
                      href={`/supplier/rfqs/${rfq.id}`}
                      className="font-medium text-aviation-primary hover:underline"
                    >
                      View
                    </Link>

                    {status === RFQStatus.Pending ? (
                      <Link
                        href={`/supplier/rfqs/${rfq.id}#submit-quote`}
                        className="font-medium text-aviation-success hover:underline"
                      >
                        Submit Quote
                      </Link>
                    ) : myQuote ? (
                      <Link
                        href={`/supplier/quotes/${myQuote.id}`}
                        className="font-medium text-aviation-primary hover:underline"
                      >
                        My Quotation
                      </Link>
                    ) : null}

                  </div>

                </td>

              </tr>
              );
            })}

          </tbody>

        </table></div>

      </div>

      <div className="flex items-center justify-between border-t bg-aviation-light px-6 py-4">

        <p className="text-sm text-aviation-muted">
          Showing {paginatedRFQs.length} of {filteredRFQs.length} RFQs
        </p>

        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={() => setPage((prev) => prev - 1)}
            disabled={page === 1}
            className="rounded-lg border px-4 py-2 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <span className="rounded-lg border bg-white px-4 py-2 text-sm font-medium">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={page === totalPages}
            className="rounded-lg border px-4 py-2 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>

        </div>

      </div>

    </div>
  );
}
