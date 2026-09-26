import Link from "next/link";

export default function QuotationEmptyState() {
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
            d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
          />
        </svg>

      </div>

      <h2 className="mt-8 text-2xl font-bold text-aviation-primary">
        No Quotations Yet
      </h2>

      <p className="mx-auto mt-4 max-w-xl text-aviation-muted">
        Quotations from suppliers will appear here after they respond
        to your Requests for Quotation (RFQs). Once received, you can
        compare prices, certifications, lead times, warranties, and
        select the supplier that best meets your operational
        requirements.
      </p>

      <Link
        href="/buyer/rfqs"
        className="mt-8 inline-flex rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white transition hover:bg-aviation-primary"
      >
        View My RFQs
      </Link>

    </div>
  );
}