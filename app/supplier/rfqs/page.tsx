import Link from "next/link";

import RFQTable from "@/components/supplier/rfq/RFQTable";

export default function SupplierRFQsPage() {
  return (
    <main className="space-y-8">

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <h1 className="text-4xl font-bold text-aviation-primary">
            Received RFQs
          </h1>

          <p className="mt-2 text-aviation-muted">
            Browse buyer Requests for Quotation, review requirements,
            and submit competitive quotations.
          </p>

        </div>

        <Link
          href="/supplier/dashboard"
          className="rounded-xl border border-aviation-border px-6 py-3 font-semibold text-aviation-primary transition hover:bg-aviation-light"
        >
          Dashboard
        </Link>

      </div>

      <RFQTable />

    </main>
  );
}