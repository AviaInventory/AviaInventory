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
          DESKTOP ORDERS TABLE
      ==================================================== */}

      {orders.length > 0 && (

        <div className="overflow-hidden rounded-2xl bg-white shadow">

          <div className="hidden overflow-x-auto md:block">

            <div className="aviation-table-wrap"><table className="min-w-full">

              <thead className="bg-aviation-light">

                <tr>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-aviation-dark">
                    Order
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-aviation-dark">
                    Part
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-aviation-dark">
                    Supplier
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-aviation-dark">
                    Quantity
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-aviation-dark">
                    Total
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-aviation-dark">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-aviation-dark">
                    Date
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold text-aviation-dark">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {orders.map((order) => (

                  <tr
                    key={order.id}
                    className="border-b last:border-b-0 transition hover:bg-aviation-light"
                  >

                    {/* ORDER */}

                    <td className="whitespace-nowrap px-6 py-5">

                      <p className="font-semibold text-aviation-primary">
                        #
                        {order.id
                          .slice(0, 8)
                          .toUpperCase()}
                      </p>

                      <p className="mt-1 text-xs text-aviation-muted">
                        {formatOrderDate(
                          order.created_at
                        )}
                      </p>

                    </td>

                    {/* PART */}

                    <td className="px-6 py-5">

                      <div className="flex items-start gap-3">

                        <div className="mt-0.5 rounded-lg bg-aviation-light p-2">
                          <Package
                            size={17}
                            className="text-aviation-muted"
                          />
                        </div>

                        <div>

                          <p className="font-semibold text-aviation-dark">
                            {order.part
                              ?.part_number ??
                              "Aviation Part"}
                          </p>

                          {order.part
                            ?.description && (
                            <p className="mt-1 max-w-xs truncate text-sm text-aviation-muted">
                              {
                                order.part
                                  .description
                              }
                            </p>
                          )}

                        </div>

                      </div>

                    </td>

                    {/* SUPPLIER */}

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-2">

                        <Building2
                          size={17}
                          className="text-aviation-muted"
                        />

                        <span className="font-medium text-aviation-dark">
                          {order.supplier
                            ?.company_name ??
                            "Supplier"}
                        </span>

                      </div>

                    </td>

                    {/* QUANTITY */}

                    <td className="whitespace-nowrap px-6 py-5 text-aviation-dark">
                      {order.quantity.toLocaleString()}
                    </td>

                    {/* TOTAL */}

                    <td className="whitespace-nowrap px-6 py-5 font-semibold text-aviation-primary">

                      {formatOrderAmount(
                        order.total_amount,
                        order.currency
                      )}

                    </td>

                    {/* STATUS */}

                    <td className="px-6 py-5">

                      <StatusBadge
                        status={
                          order.status
                        }
                      />

                    </td>

                    {/* DATE */}

                    <td className="whitespace-nowrap px-6 py-5 text-sm text-aviation-muted">

                      {formatOrderDate(
                        order.created_at
                      )}

                    </td>

                    {/* ACTION */}

                    <td className="px-6 py-5 text-right">

                      <Link
                        href={`/buyer/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 font-semibold text-aviation-primary hover:underline"
                      >

                        <Eye size={16} />

                        View

                      </Link>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table></div>

          </div>

          {/* ==================================================
              MOBILE ORDERS
          ================================================== */}

          <div className="divide-y md:hidden">

            {orders.map((order) => (

              <div
                key={order.id}
                className="p-5"
              >

                {/* HEADER */}

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-sm font-semibold text-aviation-primary">
                      Order #
                      {order.id
                        .slice(0, 8)
                        .toUpperCase()}
                    </p>

                    <h2 className="mt-1 font-bold text-aviation-dark">
                      {order.part
                        ?.part_number ??
                        "Aviation Part"}
                    </h2>

                  </div>

                  <StatusBadge
                    status={
                      order.status
                    }
                  />

                </div>

                {/* DETAILS */}

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <MobileDetail
                    label="Supplier"
                    value={
                      order.supplier
                        ?.company_name ??
                      "Supplier"
                    }
                  />

                  <MobileDetail
                    label="Quantity"
                    value={order.quantity.toLocaleString()}
                  />

                  <MobileDetail
                    label="Unit Price"
                    value={formatOrderAmount(
                      order.unit_price,
                      order.currency
                    )}
                  />

                  <MobileDetail
                    label="Total"
                    value={formatOrderAmount(
                      order.total_amount,
                      order.currency
                    )}
                  />

                  <MobileDetail
                    label="Created"
                    value={formatOrderDate(
                      order.created_at
                    )}
                  />

                </div>

                {/* DESCRIPTION */}

                {order.part
                  ?.description && (

                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-aviation-muted">
                    {
                      order.part
                        .description
                    }
                  </p>

                )}

                {/* VIEW BUTTON */}

                <Link
                  href={`/buyer/orders/${order.id}`}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-aviation-primary px-4 py-3 font-semibold text-white transition hover:bg-aviation-primary"
                >

                  <Eye size={17} />

                  View Order

                  <ChevronRight
                    size={17}
                  />

                </Link>

              </div>

            ))}

          </div>

        </div>

      )}

    </div>
  );
}

/* ==========================================================
   MOBILE DETAIL
========================================================== */

function MobileDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-aviation-light p-3">

      <p className="text-xs font-medium uppercase tracking-wide text-aviation-muted">
        {label}
      </p>

      <p className="mt-1 font-semibold text-aviation-dark">
        {value}
      </p>

    </div>
  );
}
