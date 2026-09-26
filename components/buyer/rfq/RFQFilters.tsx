"use client";

import type { RFQ } from "@/lib/rfqs";

interface Props {
  search: string;
  setSearch: (value: string) => void;

  status: RFQ["status"] | "All";
  setStatus: (value: RFQ["status"] | "All") => void;
}

export default function RFQFilters({
  search,
  setSearch,
  status,
  setStatus,
}: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">

      {/* ======================================================
         SEARCH
      ====================================================== */}

      <div className="w-full md:max-w-md">

        <label
          htmlFor="rfq-search"
          className="mb-2 block text-sm font-medium text-aviation-muted"
        >
          Search RFQs
        </label>

        <input
          id="rfq-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Part Number or Description..."
          className="w-full rounded-xl border border-aviation-border px-4 py-3 text-aviation-dark outline-none transition placeholder:text-aviation-muted focus:border-aviation-border focus:ring-2 focus:ring-aviation-primary"
        />

      </div>

      {/* ======================================================
         STATUS FILTER
      ====================================================== */}

      <div className="flex w-full flex-col gap-2 md:w-auto">

        <label
          htmlFor="rfq-status"
          className="text-sm font-medium text-aviation-muted"
        >
          Status
        </label>

        <select
          id="rfq-status"
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value as RFQ["status"] | "All"
            )
          }
          className="min-w-[180px] rounded-xl border border-aviation-border bg-white px-4 py-3 text-aviation-dark outline-none transition focus:border-aviation-border focus:ring-2 focus:ring-aviation-primary"
        >
          <option value="All">
            All Statuses
          </option>

          <option value="Draft">
            Draft
          </option>

          <option value="Open">
            Open
          </option>

          <option value="Pending">
            Pending
          </option>

          <option value="Closed">
            Closed
          </option>

          <option value="Awarded">
            Awarded
          </option>

          <option value="Cancelled">
            Cancelled
          </option>
        </select>

      </div>

    </div>
  );
}