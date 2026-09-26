import Link from "next/link";
import { BarChart3, Box, LogOut, PackageCheck, ShoppingCart, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  getAdminOrders,
  getAdminPublishedParts,
  getDashboardStats,
} from "@/lib/admin";

export default async function AdminDashboard() {
  const [stats, publishedParts, orders] = await Promise.all([
    getDashboardStats(),
    getAdminPublishedParts(),
    getAdminOrders(),
  ]);

  return (
    <main className="min-h-screen bg-aviation-success-soft p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-5 rounded-3xl bg-white p-8 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-aviation-primary">
              UpGear Aviation
            </p>
            <h1 className="mt-2 text-4xl font-bold text-aviation-primary">
              AviaInventory Admin Dashboard
            </h1>
            <p className="mt-2 text-aviation-muted">
              View-only platform statistics, supplier listings and purchased parts.
            </p>
          </div>

          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl border border-aviation-border px-5 py-3 font-semibold text-aviation-dark hover:bg-aviation-light"
            >
              <LogOut size={17} />
              Logout
            </button>
          </form>
        </header>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Registered Users" value={stats.totalUsers} icon={Users} />
          <StatCard title="Suppliers" value={stats.totalSuppliers} icon={Users} />
          <StatCard title="Published Parts" value={stats.totalPublishedParts} icon={Box} />
          <StatCard title="Orders" value={stats.totalOrders} icon={ShoppingCart} />
          <StatCard title="Purchased Qty" value={stats.totalPurchasedQuantity} icon={PackageCheck} />
        </section>

        <section className="grid gap-5 md:grid-cols-4">
          <MiniStat label="All Parts" value={stats.totalParts} />
          <MiniStat label="Buyers" value={stats.totalBuyers} />
          <MiniStat label="RFQs" value={stats.totalRFQs} />
          <MiniStat label="Quotes" value={stats.totalQuotes} />
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-aviation-primary" />
            <div>
              <h2 className="text-2xl font-bold text-aviation-dark">Sales Overview</h2>
              <p className="text-sm text-aviation-muted">Order value across accepted quotations.</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-aviation-success-soft p-6">
            <p className="text-sm text-aviation-muted">Total Order Value</p>
            <p className="mt-2 text-4xl font-bold text-aviation-primary">
              USD {stats.totalOrderValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-white shadow-sm">
          <div className="border-b p-8">
            <h2 className="text-2xl font-bold text-aviation-dark">Published Supplier Parts</h2>
            <p className="mt-1 text-sm text-aviation-muted">View-only list of currently published marketplace inventory.</p>
          </div>
          <div className="overflow-x-auto">
            <div className="aviation-table-wrap"><table className="min-w-full">
              <thead className="bg-aviation-light">
                <tr className="text-left text-sm text-aviation-muted">
                  <th className="px-6 py-4">Part Number</th>
                  <th className="px-6 py-4">Manufacturer</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {publishedParts.map((part) => (
                  <tr key={part.id} className="border-b">
                    <td className="px-6 py-4 font-semibold">{part.part_number}</td>
                    <td className="px-6 py-4">{part.manufacturer ?? "-"}</td>
                    <td className="px-6 py-4">{part.quantity ?? 0}</td>
                    <td className="px-6 py-4">{part.currency ?? "USD"} {Number(part.unit_price ?? 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-aviation-success-soft px-3 py-1 text-xs font-semibold text-aviation-success">{part.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
          {publishedParts.length === 0 && (
            <p className="p-10 text-center text-aviation-muted">No published parts found.</p>
          )}
        </section>

        <section className="rounded-3xl bg-white shadow-sm">
          <div className="border-b p-8">
            <h2 className="text-2xl font-bold text-aviation-dark">Purchased Parts / Orders</h2>
            <p className="mt-1 text-sm text-aviation-muted">View-only record of orders created from accepted quotes.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-aviation-light">
                <tr className="text-left text-sm text-aviation-muted">
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Part</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="px-6 py-4 font-semibold">#{order.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-4">{order.part?.part_number ?? "-"}</td>
                    <td className="px-6 py-4">{order.quantity}</td>
                    <td className="px-6 py-4">{order.currency} {Number(order.total_amount).toLocaleString()}</td>
                    <td className="px-6 py-4">{order.status}</td>
                    <td className="px-6 py-4">{order.created_at ? new Date(order.created_at).toLocaleDateString("en-GB") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && (
            <p className="p-10 text-center text-aviation-muted">No purchased parts/orders found.</p>
          )}
        </section>

        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/dashboard/listing-certifications" className="inline-flex items-center gap-2 rounded-xl bg-aviation-primary px-5 py-3 font-semibold text-white">Review Listing Certifications</Link>
          <Link href="/admin/dashboard/subscriptions" className="rounded-xl bg-aviation-primary px-5 py-3 font-semibold text-white">Subscriptions</Link>
          <Link href="/marketplace" className="rounded-xl bg-aviation-primary px-5 py-3 font-semibold text-white">View Marketplace</Link>
          <Link href="/" className="rounded-xl border border-aviation-border bg-white px-5 py-3 font-semibold text-aviation-dark">Home</Link>
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: number; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-aviation-muted">{title}</p>
          <p className="mt-2 text-3xl font-bold text-aviation-dark">{value.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-aviation-success-soft p-3 text-aviation-primary"><Icon size={23} /></div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-aviation-border bg-white p-5">
      <p className="text-sm text-aviation-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-aviation-primary">{value.toLocaleString()}</p>
    </div>
  );
}
