import EditPartForm from "@/components/supplier/EditPartForm";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPartPage({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-6xl p-8">
      <EditPartForm partId={id} />
    </main>
  );
}