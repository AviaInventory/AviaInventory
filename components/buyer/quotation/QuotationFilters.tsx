"use client";

interface Props {
  search: string;
  setSearch: (value: string) => void;

  status: string;
  setStatus: (value: string) => void;
}

export default function QuotationFilters({
  search,
  setSearch,
  status,
  setStatus,
}: Props) {
  return (
    <div className="flex flex-col gap-4 border-b bg-white p-6 md:flex-row md:items-center md:justify-between">

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by Part Number or Supplier..."
        className="w-full rounded-xl border border-aviation-border px-4 py-3 outline-none transition focus:border-aviation-border md:max-w-md"
      />

      <div className="flex items-center gap-3">

        <label className="text-sm font-medium text-aviation-muted">
          Status
        </label>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-aviation-border px-4 py-3 outline-none transition focus:border-aviation-border"
        >
          <option value="All">
            All
          </option>

          <option value="Submitted">
            Submitted
          </option>

          <option value="Accepted">
            Accepted
          </option>

          <option value="Rejected">
            Rejected
          </option>

          <option value="Expired">
            Expired
          </option>

          <option value="Withdrawn">
            Withdrawn
          </option>

        </select>

      </div>

    </div>
  );
}