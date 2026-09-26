import RFQDetails from "@/components/supplier/rfq/RFQDetails";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function SupplierRFQPage({
  params,
}: Props) {
  const { id } = await params;

  if (!id) {
    return (
      <div className="rounded-xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-aviation-error">
          RFQ Not Found
        </h1>

        <p className="mt-2 text-aviation-muted">
          The requested RFQ could not be found.
        </p>
      </div>
    );
  }

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-aviation-primary">
          RFQ Details
        </h1>

        <p className="mt-2 text-aviation-muted">
          Review the request, examine the specifications,
          download any supporting documents and submit your quotation.
        </p>
      </div>

      <RFQDetails rfqId={id} />
    </main>
  );
}