import SupplierShipmentDetailsPage from "@/components/supplier/shipments/SupplierShipmentDetailsPage";

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
    <SupplierShipmentDetailsPage
      shipmentId={id}
    />
  );

}