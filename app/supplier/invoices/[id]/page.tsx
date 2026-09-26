import SupplierInvoiceDetailsPage from "@/components/supplier/invoices/SupplierInvoiceDetailsPage";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({
  params,
}: Props) {

  const { id } = await params;

  return (
    <SupplierInvoiceDetailsPage
      invoiceId={id}
    />
  );

}