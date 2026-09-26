import SupplierPartDetails from "@/components/supplier/SupplierPartDetails";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function SupplierInventoryPartPage({
  params,
}: Props) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-7xl p-8">
      <SupplierPartDetails partId={id} />
    </main>
  );
}
