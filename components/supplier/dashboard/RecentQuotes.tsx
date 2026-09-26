"use client";

import Link from "next/link";

import type { Quote } from "@/lib/rfqs";
import QuoteStatusBadge from "@/components/supplier/quotes/QuoteStatusBadge";

interface Props {
  quotes: Quote[];
}

export default function RecentQuotes({
  quotes,
}: Props) {
  return (
    <section className="rounded-2xl border bg-white shadow-sm">

      <div className="flex items-center justify-between border-b px-6 py-5">

        <div>

          <h2 className="text-xl font-bold text-aviation-primary">
            Recent Quotations
          </h2>

          <p className="mt-1 text-sm text-aviation-muted">
            Your latest submitted quotations
          </p>

        </div>

        <Link
          href="/supplier/quotes"
          className="text-sm font-medium text-aviation-primary hover:underline"
        >
          View All
        </Link>

      </div>

      {quotes.length === 0 ? (

        <div className="p-12 text-center">

          <h3 className="text-lg font-semibold text-aviation-dark">
            No Quotations Submitted
          </h3>

          <p className="mt-2 text-aviation-muted">
            Your submitted quotations will appear here.
          </p>

        </div>

      ) : (

        <div className="overflow-x-auto">

          <div className="aviation-table-wrap"><table className="min-w-full">

            <thead className="bg-aviation-light">

              <tr>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Part Number
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Buyer
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Unit Price
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Lead Time
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Status
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {quotes.slice(0, 5).map((quote) => (

                <tr
                  key={quote.id}
                  className="border-t hover:bg-aviation-light"
                >

                  <td className="px-6 py-4 font-medium">
                    {quote.rfq?.part?.part_number ?? "-"}
                  </td>

                  <td className="px-6 py-4">
                    {quote.rfq?.buyer?.company_name ?? "-"}
                  </td>

                  <td className="px-6 py-4">
                    {quote.currency}{" "}
                    {quote.unit_price.toLocaleString()}
                  </td>

                  <td className="px-6 py-4">
                    {quote.lead_time}
                  </td>

                  <td className="px-6 py-4">
                    <QuoteStatusBadge
                      status={quote.status}
                    />
                  </td>

                  <td className="px-6 py-4 text-right">

                    <Link
                      href="/supplier/quotes"
                      className="rounded-lg bg-aviation-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-aviation-primary"
                    >
                      View
                    </Link>

                  </td>

                </tr>

              ))}

            </tbody>

          </table></div>

        </div>

      )}

    </section>
  );
}