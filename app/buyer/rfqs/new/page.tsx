import Link from "next/link";

import NewRFQForm from "@/components/buyer/rfq/NewRFQForm";

export default function NewRFQPage() {
  return (
    <div className="space-y-8">

      {/* ======================================================
         HEADER
      ====================================================== */}

      <section>
        <Link
          href="/buyer/rfqs"
          className="inline-flex items-center text-sm font-medium text-aviation-primary transition hover:underline"
        >
          ← Back to My RFQs
        </Link>

        <div className="mt-6">
          <h1 className="text-4xl font-bold text-aviation-primary">
            Create New RFQ
          </h1>

          <p className="mt-2 max-w-2xl text-aviation-muted">
            Submit a Request for Quotation to qualified aviation
            suppliers. Provide the required technical, quantity,
            delivery, and certification information below.
          </p>
        </div>
      </section>

      {/* ======================================================
         RFQ FORM
      ====================================================== */}

      <section>
        <NewRFQForm />
      </section>

    </div>
  );
}