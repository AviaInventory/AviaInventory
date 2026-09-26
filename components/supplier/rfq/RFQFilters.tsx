"use client";

import { RFQStatus } from "@/lib/rfqs";

interface Props {
  search: string;
  setSearch: (value: string) => void;

  status: RFQStatus | "All";
  setStatus: (value: RFQStatus | "All") => void;
}

export default function RFQFilters({
  search,
  setSearch,
  status,
  setStatus,
}: Props) {
  return (
    <div className="flex flex-col gap-4 border-b bg-white p-6 md:flex-row md:items-center md:justify-between">

      <div className="flex-1">

        <input
          type="text"
          placeholder="Search by Part Number or Buyer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-aviation-border px-4 py-3 outline-none transition focus:border-aviation-border focus:ring-2 focus:ring-aviation-primary/20"
        />

      </div>

      <div className="w-full md:w-64">

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as RFQStatus | "All")
          }
          className="w-full rounded-xl border border-aviation-border bg-white px-4 py-3 outline-none transition focus:border-aviation-border focus:ring-2 focus:ring-aviation-primary/20"
        >
          <option value="All">
            All Statuses
          </option>

          <option value={RFQStatus.Pending}>
            Pending
          </option>

          <option value={RFQStatus.Quoted}>
            Quoted
          </option>

          <option value={RFQStatus.Accepted}>
            Accepted
          </option>

          <option value={RFQStatus.Rejected}>
            Rejected
          </option>

          <option value={RFQStatus.Cancelled}>
            Cancelled
          </option>

          <option value={RFQStatus.Closed}>
            Closed
          </option>

        </select>

      </div>

    </div>
  );
}