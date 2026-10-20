import { redirect } from "next/navigation";

// A shipment is an order from payment onwards, so its details live on the order page.
export default async function ShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/supplier/purchase-orders/${id}`);
}
