import Link from "next/link";

import EditRFQForm from "@/components/buyer/rfq/EditRFQForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditRFQPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="space-y-8">
      <section>
        <Link
          href={`/buyer/rfqs/${id}`}
          className="inline-flex items-center text-sm font-medium text-aviation-primary transition hover:underline"
        >
          ← Back to RFQ
        </Link>

        <div className="mt-6">
          <h1 className="text-4xl font-bold text-aviation-primary">Edit RFQ</h1>

          <p className="mt-2 max-w-2xl text-[var(--aviation-muted)]">
            Update the part, quantity, delivery or certification details. RFQs can be edited until a supplier responds.
          </p>
        </div>
      </section>

      <section>
        <EditRFQForm rfqId={id} />
      </section>
    </div>
  );
}
