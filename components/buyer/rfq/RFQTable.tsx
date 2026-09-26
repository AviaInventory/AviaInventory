"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Search,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  getBuyerRFQs,
  formatDate,
  type RFQ,
} from "@/lib/rfqs";

import RFQFilters from "./RFQFilters";
import RFQStatusBadge from "./RFQStatusBadge";
import RFQEmptyState from "./RFQEmptyState";

const PAGE_SIZE = 10;

export default function RFQTable() {
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    RFQ["status"] | "All"
  >("All");

  const [page, setPage] = useState(1);

  /* ==========================================================
     LOAD RFQs
  ========================================================== */

  useEffect(() => {
    loadRFQs();
  }, []);

  /* ==========================================================
     RESET PAGINATION WHEN FILTERS CHANGE
  ========================================================== */

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  async function loadRFQs() {
    try {
      setLoading(true);

      const data = await getBuyerRFQs();

      setRFQs(data);
    } catch (error) {
      console.error(
        "GET BUYER RFQS ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================
     REFRESH
  ========================================================== */

  async function handleRefresh() {
    try {
      setRefreshing(true);

      const data = await getBuyerRFQs();

      setRFQs(data);
    } catch (error) {
      console.error(
        "REFRESH BUYER RFQS ERROR:",
        error
      );
    } finally {
      setRefreshing(false);
    }
  }

  /* ==========================================================
     FILTER RFQs
  ========================================================== */

  const filteredRFQs = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return rfqs.filter((rfq) => {
      if (!searchText) {
        return (
          statusFilter === "All" ||
          rfq.status === statusFilter
        );
      }

      const rfqId =
        rfq.id?.toLowerCase() ?? "";

      const partNumber =
        rfq.part?.part_number?.toLowerCase() ??
        rfq.part_number?.toLowerCase() ??
        "";

      const description =
        rfq.description?.toLowerCase() ??
        rfq.part?.description?.toLowerCase() ??
        "";

      const matchesSearch =
        rfqId.includes(searchText) ||
        partNumber.includes(searchText) ||
        description.includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        rfq.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    rfqs,
    search,
    statusFilter,
  ]);

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRFQs.length / PAGE_SIZE
    )
  );

  const safePage = Math.min(
    page,
    totalPages
  );

  const paginatedRFQs =
    filteredRFQs.slice(
      (safePage - 1) * PAGE_SIZE,
      safePage * PAGE_SIZE
    );

  /* ==========================================================
     CLEAR FILTERS
  ========================================================== */

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setPage(1);
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow">

        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-aviation-border border-t-[#6B9B7A]" />

        <p className="mt-4 text-aviation-muted">
          Loading your RFQs...
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ======================================================
         FILTERS / TOOLBAR
      ====================================================== */}

      <div className="rounded-2xl bg-white p-5 shadow">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex-1">
            <RFQFilters
              search={search}
              setSearch={setSearch}
              status={statusFilter}
              setStatus={setStatusFilter}
            />
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-aviation-border px-5 py-3 font-medium text-aviation-dark transition hover:bg-aviation-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>

      </div>

      {/* ======================================================
         EMPTY STATE
      ====================================================== */}

      {filteredRFQs.length === 0 ? (

        <div className="rounded-2xl bg-white p-8 shadow">

          {search ||
          statusFilter !== "All" ? (

            <div className="py-8 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-aviation-light">
                <Search
                  size={24}
                  className="text-aviation-muted"
                />
              </div>

              <h3 className="mt-4 text-xl font-bold text-aviation-dark">
                No RFQs Found
              </h3>

              <p className="mt-2 text-aviation-muted">
                No RFQs match your current
                search or filter.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-aviation-primary px-5 py-3 font-semibold text-white transition hover:bg-aviation-primary"
              >
                Clear Filters
              </button>

            </div>

          ) : (

            <RFQEmptyState />

          )}

        </div>

      ) : (

        <div className="overflow-hidden rounded-2xl bg-white shadow">

          {/* ==================================================
             DESKTOP TABLE
          ================================================== */}

          <div className="hidden overflow-x-auto md:block">

            <div className="aviation-table-wrap"><table className="min-w-full">

              <thead className="bg-aviation-light">

                <tr>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-aviation-dark">
                    RFQ #
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-aviation-dark">
                    Part Number
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-aviation-dark">
                    Quantity
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-aviation-dark">
                    Required Date
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-aviation-dark">
                    Quotes
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-aviation-dark">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold text-aviation-dark">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {paginatedRFQs.map(
                  (rfq) => {

                    const isClosed =
                      rfq.status ===
                        "Closed" ||
                      rfq.status ===
                        "Cancelled";

                    return (
                      <tr
                        key={rfq.id}
                        className="border-b last:border-b-0 transition hover:bg-aviation-light"
                      >

                        {/* RFQ NUMBER */}

                        <td className="whitespace-nowrap px-6 py-5">

                          <span className="font-semibold text-aviation-primary">
                            #
                            {rfq.id
                              .slice(
                                0,
                                8
                              )
                              .toUpperCase()}
                          </span>

                        </td>

                        {/* PART NUMBER */}

                        <td className="px-6 py-5">

                          <p className="font-medium text-aviation-dark">
                            {rfq.part
                              ?.part_number ??
                              rfq.part_number ??
                              "-"}
                          </p>

                          {rfq.description && (
                            <p className="mt-1 max-w-xs truncate text-sm text-aviation-muted">
                              {rfq.description}
                            </p>
                          )}

                        </td>

                        {/* QUANTITY */}

                        <td className="whitespace-nowrap px-6 py-5 text-aviation-dark">
                          {rfq.quantity.toLocaleString()}
                        </td>

                        {/* REQUIRED DATE */}

                        <td className="whitespace-nowrap px-6 py-5 text-aviation-dark">
                          {formatDate(
                            rfq.required_date
                          )}
                        </td>

                        {/* QUOTES */}

                        <td className="px-6 py-5">

                          <span className="inline-flex min-w-[32px] items-center justify-center rounded-full bg-aviation-success-soft px-3 py-1 text-sm font-semibold text-aviation-primary">
                            {rfq.quote_count ??
                              0}
                          </span>

                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">
                          <RFQStatusBadge
                            status={
                              rfq.status
                            }
                          />
                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-5">

                          <div className="flex items-center justify-end gap-4">

                            <Link
                              href={`/buyer/rfqs/${rfq.id}`}
                              className="inline-flex items-center gap-1.5 font-semibold text-aviation-primary hover:underline"
                            >
                              <Eye
                                size={16}
                              />
                              View
                            </Link>

                            {!isClosed && (
                              <Link
                                href={`/buyer/rfqs/${rfq.id}/edit`}
                                className="inline-flex items-center gap-1.5 font-semibold text-aviation-warning hover:underline"
                              >
                                <Pencil
                                  size={16}
                                />
                                Edit
                              </Link>
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

          {/* ==================================================
             MOBILE CARDS
          ================================================== */}

          <div className="divide-y md:hidden">

            {paginatedRFQs.map(
              (rfq) => {

                const isClosed =
                  rfq.status ===
                    "Closed" ||
                  rfq.status ===
                    "Cancelled";

                return (
                  <div
                    key={rfq.id}
                    className="p-5"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <p className="text-sm font-semibold text-aviation-primary">
                          RFQ #
                          {rfq.id
                            .slice(
                              0,
                              8
                            )
                            .toUpperCase()}
                        </p>

                        <h3 className="mt-1 font-bold text-aviation-dark">
                          {rfq.part
                            ?.part_number ??
                            rfq.part_number ??
                            "Custom RFQ"}
                        </h3>

                      </div>

                      <RFQStatusBadge
                        status={
                          rfq.status
                        }
                      />

                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">

                      <MobileDetail
                        label="Quantity"
                        value={rfq.quantity.toLocaleString()}
                      />

                      <MobileDetail
                        label="Required Date"
                        value={formatDate(
                          rfq.required_date
                        )}
                      />

                      <MobileDetail
                        label="Quotes"
                        value={String(
                          rfq.quote_count ??
                            0
                        )}
                      />

                      <MobileDetail
                        label="Created"
                        value={formatDate(
                          rfq.created_at
                        )}
                      />

                    </div>

                    {rfq.description && (
                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-aviation-muted">
                        {rfq.description}
                      </p>
                    )}

                    <div className="mt-5 flex gap-3">

                      <Link
                        href={`/buyer/rfqs/${rfq.id}`}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-aviation-primary px-4 py-3 font-semibold text-white transition hover:bg-aviation-primary"
                      >
                        <Eye
                          size={17}
                        />
                        View RFQ
                      </Link>

                      {!isClosed && (
                        <Link
                          href={`/buyer/rfqs/${rfq.id}/edit`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-aviation-border px-4 py-3 font-semibold text-aviation-dark transition hover:bg-aviation-light"
                        >
                          <Pencil
                            size={17}
                          />
                          Edit
                        </Link>
                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

          {/* ==================================================
             PAGINATION
          ================================================== */}

          <div className="flex flex-col gap-4 border-t px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">

            <p className="text-sm text-aviation-muted">

              Showing{" "}

              <span className="font-semibold text-aviation-dark">
                {(safePage - 1) *
                  PAGE_SIZE +
                  1}
              </span>

              {" "}–{" "}

              <span className="font-semibold text-aviation-dark">
                {Math.min(
                  safePage *
                    PAGE_SIZE,
                  filteredRFQs.length
                )}
              </span>

              {" "}of{" "}

              <span className="font-semibold text-aviation-dark">
                {filteredRFQs.length}
              </span>

              {" "}RFQs

            </p>

            {totalPages > 1 && (

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setPage(
                      (prev) =>
                        Math.max(
                          1,
                          prev - 1
                        )
                    )
                  }
                  disabled={
                    safePage === 1
                  }
                  className="inline-flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-aviation-light disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft
                    size={16}
                  />
                  Previous
                </button>

                <span className="rounded-lg border bg-aviation-light px-4 py-2 text-sm font-semibold text-aviation-dark">
                  {safePage} /{" "}
                  {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage(
                      (prev) =>
                        Math.min(
                          totalPages,
                          prev + 1
                        )
                    )
                  }
                  disabled={
                    safePage ===
                    totalPages
                  }
                  className="inline-flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-aviation-light disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight
                    size={16}
                  />
                </button>

              </div>

            )}

          </div>

        </div>
      )}

    </div>
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
    <div className="rounded-xl border bg-aviation-light p-3">

      <p className="text-xs font-medium text-aviation-muted">
        {label}
      </p>

      <p className="mt-1 font-semibold text-aviation-dark">
        {value}
      </p>

    </div>
  );
}