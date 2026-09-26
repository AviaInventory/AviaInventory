"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Truck } from "lucide-react";

import {
  getSupplierOrder,
  updateSupplierOrderStatus,
  type Order,
} from "@/lib/orders";

const statuses = [
  "Pending",
  "Processing",
  "Packed",
  "Shipped",
  "Delivered",
  "Completed",
  "Cancelled",
];

interface Props {
  orderId: string;
}

export default function PurchaseOrderDetailsPage({ orderId }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadOrder() {
    try {
      setLoading(true);
      setOrder(await getSupplierOrder(orderId));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function changeStatus(status: string) {
    if (!order) return;

    try {
      setSaving(true);
      const result = await updateSupplierOrderStatus(order.id, status);

      if (!result.success) {
        alert(result.error ?? "Unable to update order status.");
        return;
      }

      setOrder((current) =>
        current ? { ...current, status } : current
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow">
        Loading order...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow">
        <h1 className="text-2xl font-bold text-aviation-dark">Order Not Found</h1>
        <p className="mt-2 text-aviation-muted">
          This order could not be found in your supplier account.
        </p>
        <Link
          href="/supplier/purchase-orders"
          className="mt-6 inline-flex rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <Link
            href="/supplier/purchase-orders"
            className="inline-flex items-center gap-2 text-sm font-semibold text-aviation-primary hover:underline"
          >
            <ArrowLeft size={17} />
            Back to Orders
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-aviation-dark">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="mt-2 text-aviation-muted">
            Created {new Date(order.created_at).toLocaleString("en-GB")}
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrder}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-aviation-border px-5 py-3 font-semibold"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <InfoCard title="Part Number" value={order.part?.part_number ?? "-"} />
        <InfoCard title="Quantity" value={String(order.quantity)} />
        <InfoCard
          title="Order Total"
          value={`${order.currency} ${Number(order.total_amount).toLocaleString()}`}
        />
      </div>

      <section className="rounded-2xl bg-white p-8 shadow">
        <div className="flex items-center gap-3">
          <Truck className="text-aviation-primary" />
          <div>
            <h2 className="text-xl font-bold">Delivery Status</h2>
            <p className="text-sm text-aviation-muted">
              Update this as the order moves toward delivery.
            </p>
          </div>
        </div>

        <div className="mt-6 max-w-md">
          <select
            value={order.status}
            disabled={saving}
            onChange={(event) => changeStatus(event.target.value)}
            className="w-full rounded-xl border border-aviation-border px-4 py-3 outline-none focus:border-aviation-border"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <InfoCard title="Buyer ID" value={order.buyer_id} />
        <InfoCard title="RFQ ID" value={order.rfq_id} />
        <InfoCard title="Delivery Location" value={order.delivery_location ?? "Not provided"} />
        <InfoCard title="Required Date" value={order.required_date ?? "Not provided"} />
      </section>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <p className="text-sm text-aviation-muted">{title}</p>
      <p className="mt-2 break-words font-semibold text-aviation-dark">{value}</p>
    </div>
  );
}
