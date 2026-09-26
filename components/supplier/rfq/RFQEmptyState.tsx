import Link from "next/link";

export default function RFQEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-aviation-border bg-white p-16 text-center shadow-sm">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-aviation-light">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-aviation-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2
            2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
          />
        </svg>
      </div>

      <h2 className="mt-6 text-2xl font-bold text-aviation-primary">
        No RFQs Yet
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-aviation-muted">
        Buyers have not requested any quotations from your company yet.
        When a customer requests a quotation for one of your listed parts,
        it will appear here.
      </p>

      <Link
        href="/supplier/inventory"
        className="mt-8 inline-flex rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white transition hover:bg-aviation-primary"
      >
        Manage Inventory
      </Link>
    </div>
  );
}