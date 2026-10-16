"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  RefreshCw,
  ShoppingBag,
  Eye,
  Package,
  Building2,
  ChevronRight,
} from "lucide-react";

import {
  getBuyerOrders,
  formatOrderDate,
  formatOrderAmount,
  type Order,
} from "@/lib/orders";

import StatusBadge from "@/components/dashboard/StatusBadge";

/* ==========================================================
   BUYER ORDERS PAGE
========================================================== */

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  /* ========================================================
     LOAD ORDERS
  ======================================================== */

  async function loadOrders() {
    try {
      setLoading(true);

      const data =
        await getBuyerOrders();

      setOrders(data);
    } catch (error) {
      console.error(
        "LOAD BUYER ORDERS ERROR:",
        error
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {
    loadOrders();
  }, []);

  /* ========================================================
     REFRESH
  ======================================================== */

  async function handleRefresh() {
    try {
      setRefreshing(true);

      const data =
        await getBuyerOrders();

      setOrders(data);
    } catch (error) {
      console.error(
        "REFRESH BUYER ORDERS ERROR:",
        error
      );

      alert(
        "Unable to refresh your orders."
      );
    } finally {
      setRefreshing(false);
    }
  }

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow">

        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-aviation-border border-t-[#6B9B7A]" />

        <p className="mt-4 text-aviation-muted">
          Loading your orders...
        </p>

      </div>
    );
  }

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="space-y-6">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-start gap-4">

          <div className="hidden rounded-xl bg-aviation-primary/10 p-3 sm:block">
            <ShoppingBag
              size={25}
              className="text-aviation-primary"
            />
          </div>

          <div>

            <h1 className="text-2xl font-bold text-aviation-dark">
              My Orders
            </h1>

            <p className="mt-1 text-sm text-aviation-muted">
              View and track your aviation parts orders.
            </p>

          </div>

        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-aviation-border px-5 py-3 font-medium text-aviation-dark transition hover:bg-aviation-light disabled:cursor-not-allowed disabled:opacity-50"
        >

          <RefreshCw
            size={17}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}

        </button>

      </div>

      {/* ====================================================
          EMPTY STATE
      ==================================================== */}

      {orders.length === 0 && (

        <div className="rounded-2xl bg-white p-12 text-center shadow">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-aviation-success-soft">

            <ShoppingBag
              size={30}
              className="text-aviation-primary"
            />

          </div>

          <h2 className="mt-5 text-xl font-bold text-aviation-dark">
            No Orders Yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-aviation-muted">
            Orders created from accepted supplier
            quotes will appear here.
          </p>

          <Link
            href="/buyer/rfqs"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white transition hover:bg-aviation-primary"
          >
            View My RFQs
            <ChevronRight size={17} />
          </Link>

        </div>

      )}

      {/* ====================================================
          ORDERS LIST
          One card per order that reflows by available width
          (any zoom level or screen) instead of a wide table.
      ==================================================== */}

      {orders.length > 0 && (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/buyer/orders/${order.id}`}
                className="group block rounded-2xl border border-aviation-border bg-white p-4 shadow-sm transition hover:border-aviation-primary/40 hover:shadow-md sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-aviation-primary">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                      <span className="ml-2 font-normal text-aviation-muted">· {formatOrderDate(order.created_at)}</span>
                    </p>
                    <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-aviation-dark">
                      <Package size={18} className="shrink-0 text-aviation-muted" aria-hidden="true" />
                      <span className="aviation-break-anywhere">{order.part?.part_number ?? "Aviation part"}</span>
                    </h2>
                    {order.part?.description && (
                      <p className="mt-1 line-clamp-1 text-sm text-aviation-muted">{order.part.description}</p>
                    )}
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <dl className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
                  <OrderFact label="Supplier">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 size={15} className="shrink-0 text-aviation-muted" aria-hidden="true" />
                      {order.supplier?.company_name ?? "Supplier"}
                    </span>
                  </OrderFact>
                  <OrderFact label="Quantity">{order.quantity.toLocaleString()}</OrderFact>
                  <OrderFact label="Unit price">{formatOrderAmount(order.unit_price, order.currency)}</OrderFact>
                  <OrderFact label="Total">
                    <span className="text-aviation-primary">{formatOrderAmount(order.total_amount, order.currency)}</span>
                  </OrderFact>
                </dl>

                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-aviation-primary group-hover:underline">
                  <Eye size={16} aria-hidden="true" /> View order <ChevronRight size={16} aria-hidden="true" />
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}

/* ==========================================================
   ORDER FACT
========================================================== */

function OrderFact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-aviation-light px-3 py-2.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-aviation-muted">
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-aviation-dark">
        {children}
      </dd>
    </div>
  );
}
