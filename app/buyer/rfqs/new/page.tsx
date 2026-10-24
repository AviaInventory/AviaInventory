import Link from "next/link";

import NewRFQForm from "@/components/buyer/rfq/NewRFQForm";

type Props = { searchParams: Promise<{ type?: string | string[] }> };

export default async function NewRFQPage({ searchParams }: Props) {
  // ?type=parts or ?type=mro (e.g. from the MRO Services page) preselects the RFQ type.
  const { type } = await searchParams;
  const requested = Array.isArray(type) ? type[0] : type;
  const initialType = requested === "mro" || requested === "parts" ? requested : null;

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
            Request quotations for aircraft parts from qualified suppliers, or for
            repair / overhaul of components from MRO-capable suppliers.
          </p>
        </div>
      </section>

      {/* ======================================================
         RFQ FORM
      ====================================================== */}

      <section>
        <NewRFQForm initialType={initialType} />
      </section>

    </div>
  );
}
