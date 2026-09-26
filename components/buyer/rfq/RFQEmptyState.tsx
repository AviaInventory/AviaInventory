import Link from "next/link";

export default function RFQEmptyState() {
  return (
    <div className="rounded-2xl bg-white p-16 text-center shadow">

      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-aviation-light">

        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-aviation-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6l4 2m4-2a8 8 0 11-16 0 8 8 0 0116 0z"
          />
        </svg>

      </div>

      <h2 className="mt-8 text-2xl font-bold text-aviation-primary">
        No Requests for Quotation
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-aviation-muted">
        You haven't created any Requests for Quotation yet.
        Submit an RFQ to invite qualified aviation suppliers to
        provide quotations for aircraft parts, engines, avionics,
        consumables or maintenance requirements.
      </p>

      <div className="mt-10">

        <Link
          href="/buyer/rfqs/new"
          className="inline-flex rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white transition hover:bg-aviation-primary"
        >
          Create Your First RFQ
        </Link>

      </div>

    </div>
  );
}