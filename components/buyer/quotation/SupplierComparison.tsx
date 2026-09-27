"use client";

import QuotationStatusBadge from "./QuotationStatusBadge";

import type { Quote } from "@/lib/rfqs";

interface Props {
  quotes: Quote[];
  onAccept: (quoteId: string) => void;
  onReject: (quoteId: string) => void;
  processing?: boolean;
}

export default function SupplierComparison({
  quotes,
  onAccept,
  onReject,
  processing = false,
}: Props) {
  if (!quotes.length) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow">
        No quotations available for comparison.
      </div>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-8 shadow">

      <h2 className="mb-8 text-3xl font-bold text-aviation-primary">
        Compare Supplier Quotations
      </h2>

      <div className="space-y-8">

        {quotes.map((quote) => (

          <div
            key={quote.id}
            className="rounded-2xl border bg-white p-8"
          >

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <h3 className="text-2xl font-bold">

                  {quote.supplier?.company_name}

                </h3>

                <p className="mt-2 text-aviation-muted">

                  Submitted on{" "}
                  {new Date(
                    quote.created_at
                  ).toLocaleDateString()}

                </p>

              </div>

              <QuotationStatusBadge
                status={quote.status}
              />

            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

              <InfoCard
                title="Price"
                value={`${quote.currency} ${quote.unit_price.toLocaleString()}`}
              />

              <InfoCard
                title="Lead Time"
                value={quote.lead_time}
              />

              <InfoCard
                title="Condition"
                value={quote.condition}
              />

              <InfoCard
                title="Warranty"
                value={quote.warranty || "-"}
              />

              <InfoCard
                title="Certification"
                value={quote.certification?.length ? quote.certification.join(", ") : "-"}
              />

              <InfoCard
                title="Valid Until"
                value={quote.valid_until || "-"}
              />

              <InfoCard
                title="Message"
                value={quote.message || "-"}
              />

              <InfoCard
                title="Status"
                value={quote.status}
              />

            </div>

            <div className="mt-8 flex gap-4">

              <button
                onClick={() => onAccept(quote.id)}
                disabled={
                  processing ||
                  quote.status === "Accepted"
                }
                className="rounded-xl bg-aviation-success px-6 py-3 font-semibold text-white transition hover:bg-aviation-success disabled:cursor-not-allowed disabled:opacity-50"
              >
                Accept Quote
              </button>

              <button
                onClick={() => onReject(quote.id)}
                disabled={
                  processing ||
                  quote.status === "Rejected"
                }
                className="rounded-xl bg-aviation-error px-6 py-3 font-semibold text-white transition hover:bg-aviation-error disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reject Quote
              </button>

            </div>

          </div>

        ))}

      </div>

    </section>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-xl border bg-aviation-light p-5">

      <p className="text-sm text-aviation-muted">
        {title}
      </p>

      <p className="mt-2 font-semibold break-words">
        {value || "-"}
      </p>

    </div>
  );
}