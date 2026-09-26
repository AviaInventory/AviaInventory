import PurchaseOrderDetailsPage from "@/components/supplier/orders/PurchaseOrderDetailsPage";

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
    <PurchaseOrderDetailsPage
      orderId={id}
    />
  );

}