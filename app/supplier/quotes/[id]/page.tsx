import QuoteDetails from "@/components/supplier/quotes/QuoteDetails";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function SupplierQuotePage({
  params,
}: Props) {
  const { id } = await params;

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-aviation-primary">
          Quotation Details
        </h1>

        <p className="mt-2 text-aviation-muted">
          The quotation you sent to the buyer. Sent quotations are kept as a read-only record.
        </p>
      </div>

      <QuoteDetails quoteId={id} />
    </main>
  );
}
