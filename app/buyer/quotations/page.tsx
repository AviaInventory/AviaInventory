import QuotationsTable from "@/components/buyer/quotation/QuotationsTable";

export default function BuyerQuotationsPage() {
  return (
    <main className="space-y-8">

      <div>

        <h1 className="text-4xl font-bold text-aviation-primary">
          Quotations
        </h1>

        <p className="mt-2 text-aviation-muted">
          Review quotations received from suppliers.
        </p>

      </div>

      <QuotationsTable />

    </main>
  );
}