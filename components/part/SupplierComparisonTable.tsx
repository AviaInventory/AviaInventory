"use client";

import Link from "next/link";

const suppliers = [
  {
    id: 1,
    supplier: "Aero Components Ltd",
    country: "United Kingdom",
    condition: "NEW",
    stock: 18,
    leadTime: "2 Days",
    certification: "FAA / EASA",
    verified: true,
  },
  {
    id: 2,
    supplier: "Global Aircraft Parts",
    country: "United States",
    condition: "SERVICEABLE",
    stock: 7,
    leadTime: "1 Day",
    certification: "FAA",
    verified: true,
  },
  {
    id: 3,
    supplier: "Sky Aviation Supplies",
    country: "United Arab Emirates",
    condition: "OVERHAULED",
    stock: 4,
    leadTime: "5 Days",
    certification: "EASA",
    verified: true,
  },
];

export default function SupplierComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">

      <div className="aviation-table-wrap"><table className="min-w-full">

        <thead className="bg-aviation-primary text-white">

          <tr>

            <th className="px-6 py-4 text-left">Supplier</th>

            <th className="px-6 py-4 text-left">Country</th>

            <th className="px-6 py-4 text-left">Condition</th>

            <th className="px-6 py-4 text-center">Stock</th>

            <th className="px-6 py-4 text-center">Lead Time</th>

            <th className="px-6 py-4 text-center">Certification</th>

            <th className="px-6 py-4 text-center">Verified</th>

            <th className="px-6 py-4 text-center">Action</th>

          </tr>

        </thead>

        <tbody>

          {suppliers.map((supplier) => (

            <tr
              key={supplier.id}
              className="border-b hover:bg-aviation-light"
            >

              <td className="px-6 py-5 font-semibold">
                {supplier.supplier}
              </td>

              <td className="px-6 py-5">
                {supplier.country}
              </td>

              <td className="px-6 py-5">
                {supplier.condition}
              </td>

              <td className="px-6 py-5 text-center">
                {supplier.stock}
              </td>

              <td className="px-6 py-5 text-center">
                {supplier.leadTime}
              </td>

              <td className="px-6 py-5 text-center">
                {supplier.certification}
              </td>

              <td className="px-6 py-5 text-center">

                {supplier.verified ? (
                  <span className="rounded-full bg-aviation-success-soft px-3 py-1 text-xs font-semibold text-aviation-success">
                    Verified
                  </span>
                ) : (
                  <span className="rounded-full bg-aviation-error-soft px-3 py-1 text-xs font-semibold text-aviation-error">
                    No
                  </span>
                )}

              </td>

              <td className="px-6 py-5 text-center">

                <Link
                  href="/login"
                  className="rounded-lg bg-aviation-primary px-4 py-2 text-sm font-semibold text-white hover:bg-aviation-primary"
                >
                  Request RFQ
                </Link>

              </td>

            </tr>

          ))}

        </tbody>

      </table></div>

    </div>
  );
}