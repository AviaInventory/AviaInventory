import InventoryTable from "@/components/supplier/InventoryTable";

export default function InventoryPage() {
  return (
    <main className="space-y-8">

      <div className="mb-8 flex items-center justify-between">

        <div>

          <h1 className="text-4xl font-bold text-aviation-primary">
            Inventory
          </h1>

          <p className="mt-2 text-aviation-muted">
            Manage your aircraft parts inventory.
          </p>

        </div>

      </div>

      <InventoryTable />

    </main>
  );
}