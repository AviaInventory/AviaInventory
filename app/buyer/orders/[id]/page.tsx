import { Suspense } from "react";
import OrderWorkspace from "@/components/orders/OrderWorkspace";

export default async function BuyerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <OrderWorkspace orderId={id} role="buyer" />
    </Suspense>
  );
}
