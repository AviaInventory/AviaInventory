"use client";

interface QuoteFiltersProps {
  search: string;
  status: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export default function QuoteFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: QuoteFiltersProps) {
  return (
    <div className="rounded-2xl border border-aviation-border bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">

        {/* Search */}

        <div>
          <label
            htmlFor="quote-search"
            className="mb-2 block text-sm font-medium text-aviation-dark"
          >
            Search Quotations
          </label>

          <input
            id="quote-search"
            type="text"
            value={search}
            onChange={(e) =>
              onSearchChange(e.target.value)
            }
            placeholder="Search by part number or RFQ..."
            className="w-full rounded-xl border border-aviation-border px-4 py-3 text-sm outline-none transition focus:border-aviation-border focus:ring-2 focus:ring-aviation-primary"
          />
        </div>

        {/* Status */}

        <div>
          <label
            htmlFor="quote-status"
            className="mb-2 block text-sm font-medium text-aviation-dark"
          >
            Status
          </label>

          <select
            id="quote-status"
            value={status}
            onChange={(e) =>
              onStatusChange(e.target.value)
            }
            className="w-full rounded-xl border border-aviation-border bg-white px-4 py-3 text-sm outline-none transition focus:border-aviation-border focus:ring-2 focus:ring-aviation-primary"
          >
            <option value="all">
              All Statuses
            </option>

            <option value="Draft">
              Draft
            </option>

            <option value="Submitted">
              Submitted
            </option>

            <option value="Pending">
              Pending
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
          </select>
        </div>

      </div>
    </div>
  );
}