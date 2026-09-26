"use client";

import Link from "next/link";

import type { RFQ } from "@/lib/rfqs";
import RFQStatusBadge from "@/components/supplier/rfq/RFQStatusBadge";

interface Props {
  rfqs: RFQ[];
}

export default function RecentRFQs({
  rfqs,
}: Props) {
  return (
    <section className="rounded-2xl border bg-white shadow-sm">

      <div className="flex items-center justify-between border-b px-6 py-5">

        <div>

          <h2 className="text-xl font-bold text-aviation-primary">
            Recent RFQs
          </h2>

          <p className="mt-1 text-sm text-aviation-muted">
            Latest requests available for quotation
          </p>

        </div>

        <Link
          href="/supplier/rfqs"
          className="text-sm font-medium text-aviation-primary hover:underline"
        >
          View All
        </Link>

      </div>

      {rfqs.length === 0 ? (

        <div className="p-12 text-center">

          <h3 className="text-lg font-semibold text-aviation-dark">
            No RFQs Available
          </h3>

          <p className="mt-2 text-aviation-muted">
            New buyer requests will appear here.
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
                  Quantity
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Required Date
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

              {rfqs.slice(0, 5).map((rfq) => (

                <tr
                  key={rfq.id}
                  className="border-t hover:bg-aviation-light"
                >

                  <td className="px-6 py-4 font-medium">
                    {rfq.part?.part_number ?? "-"}
                  </td>

                  <td className="px-6 py-4">
                    {rfq.buyer?.company_name ?? "-"}
                  </td>

                  <td className="px-6 py-4">
                    {rfq.quantity.toLocaleString()}
                  </td>

                  <td className="px-6 py-4">
                    {rfq.required_date ?? "-"}
                  </td>

                  <td className="px-6 py-4">
                    <RFQStatusBadge
                      status={rfq.status}
                    />
                  </td>

                  <td className="px-6 py-4 text-right">

                    <Link
                      href={`/supplier/rfqs/${rfq.id}`}
                      className="rounded-lg bg-aviation-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-aviation-primary"
                    >
                      View RFQ
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