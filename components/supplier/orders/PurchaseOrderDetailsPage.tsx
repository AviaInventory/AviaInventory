"use client";

import { Suspense } from "react";
import OrderWorkspace from "@/components/orders/OrderWorkspace";

export default function PurchaseOrderDetailsPage({ orderId }: { orderId: string }) {
  return (
    <Suspense>
      <OrderWorkspace orderId={orderId} role="supplier" />
    </Suspense>
  );
}
