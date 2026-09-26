import Link from "next/link";

import RFQTable from "@/components/buyer/rfq/RFQTable";

export default function BuyerRFQsPage() {
  return (
    <main className="space-y-8">

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <h1 className="text-4xl font-bold text-aviation-primary">
            My Requests for Quotation
          </h1>

          <p className="mt-2 text-aviation-muted">
            Create, monitor and manage all of your Requests for Quotation.
          </p>

        </div>

        <Link
          href="/buyer/rfqs/new"
          className="rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white transition hover:bg-aviation-primary"
        >
          + New RFQ
        </Link>

      </div>

      <RFQTable />

    </main>
  );
}