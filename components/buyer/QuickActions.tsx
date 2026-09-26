"use client";

import Link from "next/link";
import {
  Search,
  FileText,
  Package,
  ShoppingCart,
} from "lucide-react";

export default function QuickActions() {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-aviation-primary">
          Quick Actions
        </h2>

        <p className="mt-1 text-sm text-aviation-muted">
          Quickly access the most important buyer functions.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* Search Parts */}
        <Link
          href="/marketplace"
          className="group rounded-xl border border-aviation-border p-5 transition hover:border-aviation-border hover:bg-aviation-success-soft"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-aviation-success-soft transition group-hover:bg-white">
            <Search
              size={21}
              className="text-aviation-primary"
            />
          </div>

          <h3 className="mt-4 font-semibold text-aviation-primary">
            Search Parts
          </h3>

          <p className="mt-2 text-sm text-aviation-muted">
            Search aviation parts from verified suppliers.
          </p>
        </Link>

        {/* New RFQ */}
        <Link
          href="/buyer/rfqs/new"
          className="group rounded-xl border border-aviation-border p-5 transition hover:border-aviation-border hover:bg-aviation-success-soft"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-aviation-success-soft transition group-hover:bg-white">
            <FileText
              size={21}
              className="text-aviation-primary"
            />
          </div>

          <h3 className="mt-4 font-semibold text-aviation-primary">
            Create RFQ
          </h3>

          <p className="mt-2 text-sm text-aviation-muted">
            Request quotations from aviation suppliers.
          </p>
        </Link>

        {/* My RFQs */}
        <Link
          href="/buyer/rfqs"
          className="group rounded-xl border border-aviation-border p-5 transition hover:border-aviation-border hover:bg-aviation-success-soft"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-aviation-success-soft transition group-hover:bg-white">
            <Package
              size={21}
              className="text-aviation-primary"
            />
          </div>

          <h3 className="mt-4 font-semibold text-aviation-primary">
            My RFQs
          </h3>

          <p className="mt-2 text-sm text-aviation-muted">
            Monitor your quotation requests and responses.
          </p>
        </Link>

        {/* Orders */}
        <Link
          href="/buyer/orders"
          className="group rounded-xl border border-aviation-border p-5 transition hover:border-aviation-border hover:bg-aviation-success-soft"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-aviation-success-soft transition group-hover:bg-white">
            <ShoppingCart
              size={21}
              className="text-aviation-primary"
            />
          </div>

          <h3 className="mt-4 font-semibold text-aviation-primary">
            My Orders
          </h3>

          <p className="mt-2 text-sm text-aviation-muted">
            View and manage your aviation parts orders.
          </p>
        </Link>

      </div>
    </section>
  );
}