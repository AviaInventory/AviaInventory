"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, Search, ShoppingCart } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import EmptyState from "@/components/dashboard/EmptyState";

import {
  getSupplierOrders,
  updateSupplierOrderStatus,
  type Order,
} from "@/lib/orders";

// Matches guard_order_updates(): suppliers move an order one step at a time.
const NEXT_STATUSES: Record<string, string[]> = {
  Pending: ["Processing", "Cancelled"],
  Processing: ["Packed", "Cancelled"],
  Packed: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: ["Completed"],
};

const statuses = [
  "Pending",
  "Processing",
  "Packed",
  "Shipped",
  "Delivered",
  "Completed",
  "Cancelled",
];

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await getSupplierOrders();
      setOrders(data);
    } catch (error) {
      console.error("LOAD SUPPLIER ORDERS ERROR:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function refresh() {
    try {
      setRefreshing(true);
      const data = await getSupplierOrders();
      setOrders(data);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleStatusChange(orderId: string, status: string) {
    const result = await updateSupplierOrderStatus(orderId, status);

    if (!result.success) {
      alert(result.error ?? "Unable to update the order.");
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  }

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "All" || order.status === statusFilter;

      const partNumber = order.part?.part_number?.toLowerCase() ?? "";
      const description = order.part?.description?.toLowerCase() ?? "";

      const matchesSearch =
        !query ||
        partNumber.includes(query) ||
        description.includes(query) ||
        order.id.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const totalValue = orders.reduce(
    (sum, order) => sum + Number(order.total_amount ?? 0),
    0
  );

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow">
        Loading customer orders...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-aviation-primary">
            Customer Orders
          </h1>
          <p className="mt-2 text-aviation-muted">
            Orders created when buyers accept your quotations. Update the
            status as each order moves toward delivery.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-aviation-border px-5 py-3 font-semibold text-aviation-dark disabled:opacity-50"
        >
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Orders" value={orders.length} />
        <SummaryCard
          title="Pending"
          value={orders.filter((order) => order.status === "Pending").length}
        />
        <SummaryCard
          title="In Progress"
          value={orders.filter((order) => ["Processing", "Packed", "Shipped"].includes(order.status)).length}
        />
        <SummaryCard
          title="Order Value"
          value={`USD ${totalValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
        />
      </div>

      <section className="rounded-2xl bg-white p-6 shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-3 text-aviation-muted" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order or part number..."
              className="w-full rounded-xl border border-aviation-border py-3 pl-10 pr-4 outline-none focus:border-aviation-border"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-aviation-border px-4 py-3 outline-none focus:border-aviation-border"
          >
            <option value="All">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </section>

      {filteredOrders.length === 0 ? (
        <EmptyState icon={ShoppingCart} eyebrow="NO ORDERS YET" title="Your order queue is clear" description="When a buyer accepts one of your quotations, the resulting purchase order will appear here for fulfillment and status updates." actionLabel="Review RFQs" actionHref="/supplier/rfqs" />
      ) : (
        // Cards reflow with the available width, so nothing squeezes or scrolls sideways when zoomed.
        <ul className="space-y-3">
          {filteredOrders.map((order) => {
            const nextSteps = NEXT_STATUSES[order.status] ?? [];
            return (
              <li key={order.id} className="rounded-2xl border border-aviation-border bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-aviation-primary">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                      <span className="ml-2 font-normal text-aviation-muted">
                        · {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </p>
                    <h2 className="aviation-break-anywhere mt-1 text-lg font-bold text-aviation-dark">
                      {order.part?.part_number ?? "Aviation part"}
                    </h2>
                    {(order.part?.description || order.part?.manufacturer) && (
                      <p className="mt-1 line-clamp-1 text-sm text-aviation-muted">
                        {order.part?.description || order.part?.manufacturer}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <dl className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                  <Fact label="Quantity">{order.quantity.toLocaleString()}</Fact>
                  <Fact label="Unit price">{order.currency} {Number(order.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Fact>
                  <Fact label="Total">{order.currency} {Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Fact>
                </dl>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  {nextSteps.length > 0 ? (
                    <label className="flex flex-wrap items-center gap-2 text-sm text-aviation-muted">
                      Move to
                      <select
                        value=""
                        onChange={(event) => event.target.value && handleStatusChange(order.id, event.target.value)}
                        aria-label={`Update status for order ${order.id.slice(0, 8)}`}
                        className="min-h-10 rounded-lg border border-aviation-border bg-white px-3 py-2 text-sm font-semibold text-aviation-dark"
                      >
                        <option value="">Choose next step…</option>
                        {nextSteps.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <span className="text-sm text-aviation-muted">No further status changes.</span>
                  )}
                  <Link
                    href={`/supplier/purchase-orders/${order.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-aviation-primary hover:underline"
                  >
                    <Eye size={16} aria-hidden="true" /> View order
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <p className="text-sm text-aviation-muted">{title}</p>
      <p className="mt-2 text-3xl font-bold text-aviation-dark">{value}</p>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl bg-aviation-light px-3 py-2.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-aviation-muted">{label}</dt>
      <dd className="mt-1 font-semibold text-aviation-dark">{children}</dd>
    </div>
  );
}
