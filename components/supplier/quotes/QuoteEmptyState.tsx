"use client";

import Link from "next/link";

export default function QuoteEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-aviation-border bg-white p-10 text-center">
      
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-aviation-success-soft">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7 text-aviation-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 14.25l6-6m-5.25-3h5.5A2.75 2.75 0 0118 8v8a2.75 2.75 0 01-2.75 2.75h-5.5A2.75 2.75 0 017 16V8a2.75 2.75 0 012.75-2.75z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 14.25h.008v.008H9v-.008zM15 9.75h.008v.008H15V9.75z"
          />
        </svg>
      </div>

      <h3 className="mt-5 text-xl font-bold text-aviation-primary">
        No Quotations Yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-aviation-muted">
        You have not submitted any quotations yet. Quotations submitted in
        response to buyer RFQs will appear here.
      </p>

      <div className="mt-6">
        <Link
          href="/supplier/rfqs"
          className="inline-flex items-center justify-center rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white transition hover:bg-aviation-primary"
        >
          View RFQs
        </Link>
      </div>
    </div>
  );
}