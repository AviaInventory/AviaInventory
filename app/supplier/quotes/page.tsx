import QuoteTable from "@/components/supplier/quotes/QuoteTable";

export default function SupplierQuotesPage() {
  return (
    <main className="space-y-8">

      <div>
        <h1 className="text-4xl font-bold text-aviation-primary">
          My Quotations
        </h1>

        <p className="mt-2 text-aviation-muted">
          Track all quotations you have submitted to buyers.
        </p>
      </div>

      <QuoteTable />

    </main>
  );
}