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
        <section className="overflow-hidden rounded-2xl bg-white shadow">
          <div className="overflow-x-auto">
            <div className="aviation-table-wrap"><table className="min-w-full">
              <thead className="bg-aviation-light">
                <tr className="text-left text-sm font-semibold text-aviation-muted">
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Part</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-aviation-light">
                    <td className="px-6 py-4 font-semibold">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold">{order.part?.part_number ?? "Part"}</p>
                      <p className="text-sm text-aviation-muted">{order.part?.manufacturer ?? ""}</p>
                    </td>
                    <td className="px-6 py-4">{order.quantity}</td>
                    <td className="px-6 py-4">
                      {order.currency} {Number(order.total_amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-2">
                        <StatusBadge status={order.status} />
                        <select
                          value={order.status}
                          onChange={(event) =>
                            handleStatusChange(order.id, event.target.value)
                          }
                          aria-label={`Update status for order ${order.id.slice(0, 8)}`}
                          className="rounded-lg border border-aviation-border bg-white px-2 py-1 text-xs text-aviation-muted"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-aviation-muted">
                      {new Date(order.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/supplier/purchase-orders/${order.id}`}
                        className="inline-flex items-center gap-2 text-aviation-primary hover:underline"
                      >
                        <Eye size={17} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </section>
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
