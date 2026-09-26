"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function RecentOrders() {
  return (
    <section className="rounded-2xl border border-aviation-border bg-white p-6 shadow-sm">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex items-start justify-between gap-4">

        <div>
          <h2 className="text-xl font-bold text-aviation-dark">
            Recent Orders
          </h2>

          <p className="mt-1 text-sm text-aviation-muted">
            Your latest aviation parts orders.
          </p>
        </div>

        <Link
          href="/buyer/orders"
          className="text-sm font-semibold text-aviation-primary hover:underline"
        >
          View All
        </Link>

      </div>

      {/* ===================================================
          ORDERS NOT AVAILABLE YET
      =================================================== */}

      <div className="mt-6 rounded-xl border border-dashed border-aviation-border p-10 text-center">

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-aviation-success-soft">
          <ShoppingCart
            size={22}
            className="text-aviation-primary"
          />
        </div>

        <h3 className="mt-4 font-semibold text-aviation-dark">
          No Orders Yet
        </h3>

        <p className="mt-2 text-sm leading-6 text-aviation-muted">
          Your orders will appear here once the AviaInventory
          order system is available.
        </p>

        <Link
          href="/marketplace"
          className="mt-5 inline-flex rounded-lg bg-aviation-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-aviation-primary"
        >
          Browse Parts
        </Link>

      </div>

    </section>
  );
}