"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search, Truck } from "lucide-react";
import EmptyState from "@/components/dashboard/EmptyState";
import { formatOrderDate, getSupplierOrders, type Order } from "@/lib/orders";
import {
  SHIPMENT_STATUSES, shipmentNumber, shipmentStatus, shipmentStatusLabel, trackingUrl, type ShipmentStatus,
} from "@/lib/shipments";

type Shipment = { order: Order; status: ShipmentStatus };

const STATUS_STYLES: Record<ShipmentStatus, string> = {
  "Pending Dispatch": "bg-aviation-warning-soft text-aviation-warning",
  "In Transit": "bg-aviation-primary/10 text-aviation-primary",
  Delivered: "bg-aviation-success-soft text-aviation-success",
};

function StatusPill({ shipment }: { shipment: Shipment }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[shipment.status]}`}>
      {shipmentStatusLabel(shipment.status, shipment.order.shipping_method)}
    </span>
  );
}

function Actions({ shipment }: { shipment: Shipment }) {
  const { order, status } = shipment;
  const track = trackingUrl(order.dispatch_carrier ?? order.shipping_method, order.tracking_number);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "Pending Dispatch" && (
        <Link href={`/supplier/purchase-orders/${order.id}?step=next`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-aviation-primary px-3 text-xs font-bold text-white">
          <Truck size={14} /> {order.shipping_method === "Own pick-up" ? "Ready for collection" : "Dispatch"}
        </Link>
      )}
      {status === "In Transit" && track && (
        <a href={track} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-aviation-border px-3 text-xs font-semibold text-aviation-primary">
          Track <ExternalLink size={13} />
        </a>
      )}
      <Link href={`/supplier/purchase-orders/${order.id}`} className="text-xs font-semibold text-aviation-primary hover:underline">View order</Link>
    </div>
  );
}

const destination = (order: Order) => [order.ship_to_city, order.ship_to_country].filter(Boolean).join(", ") || "—";

export default function SupplierShipmentsPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ShipmentStatus>("All");

  useEffect(() => {
    let active = true;
    const load = () => getSupplierOrders().then((rows) => { if (active) setOrders(rows); });
    load();
    // Stay current while open: the buyer confirming delivery moves a shipment to Delivered.
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") load(); }, 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const shipments = useMemo<Shipment[]>(() => (orders ?? []).flatMap((order) => {
    const status = shipmentStatus(order.status);
    return status ? [{ order, status }] : [];
  }), [orders]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return shipments.filter(({ order, status }) =>
      (statusFilter === "All" || status === statusFilter)
      && (!query || [shipmentNumber(order), order.po_number, order.tracking_number, order.buyer_company_name, order.part?.part_number]
        .some((value) => value?.toLowerCase().includes(query))));
  }, [shipments, search, statusFilter]);

  const count = (status: ShipmentStatus) => shipments.filter((shipment) => shipment.status === status).length;
  const cards = [
    { title: "Total Shipments", value: shipments.length, className: "text-aviation-dark" },
    { title: "In Transit", value: count("In Transit"), className: "text-aviation-primary" },
    { title: "Delivered", value: count("Delivered"), className: "text-aviation-success" },
    { title: "Pending Dispatch", value: count("Pending Dispatch"), className: "text-aviation-warning" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-aviation-primary">Shipments</h1>
        <p className="mt-2 text-aviation-muted">Paid orders ready to dispatch, shipments on their way and delivered orders.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-aviation-muted">{card.title}</p>
            <p className={`mt-2 text-3xl font-bold ${card.className}`}>{orders === null ? "–" : card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-3 text-aviation-muted" size={18} aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shipment, PO, tracking or buyer…" aria-label="Search shipments" className="min-h-11 w-full rounded-xl border border-aviation-border py-2.5 pl-10 pr-4 text-sm outline-none focus:border-aviation-primary" />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} aria-label="Filter by status" className="min-h-11 rounded-xl border border-aviation-border bg-white px-4 text-sm">
          <option value="All">All statuses</option>
          {SHIPMENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>

      {orders === null ? (
        <div className="space-y-3" aria-busy="true">{[0, 1, 2].map((key) => <div key={key} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : visible.length === 0 ? (
        <EmptyState icon={Truck} eyebrow="NO SHIPMENTS" title={shipments.length ? "No shipments match" : "Nothing to ship yet"} description="Orders appear here once the buyer's payment is confirmed. Dispatch them from here and track them until the buyer confirms delivery." actionLabel="View orders" actionHref="/supplier/purchase-orders" />
      ) : (
        <>
          {/* Wide screens: table. Narrower screens or zoomed in: cards, so nothing is squeezed. */}
          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm xl:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-aviation-light text-xs uppercase tracking-wide text-aviation-muted">
                <tr>
                  {["Shipment #", "PO Number", "Buyer", "Courier", "Tracking No.", "Destination", "Status", "Ship Date", "Actions"].map((heading) => (
                    <th key={heading} className="whitespace-nowrap px-4 py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-aviation-border">
                {visible.map((shipment) => {
                  const { order } = shipment;
                  return (
                    <tr key={order.id} className="align-middle hover:bg-aviation-light/60">
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-aviation-primary">{shipmentNumber(order)}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono">{order.po_number ?? "—"}</td>
                      <td className="px-4 py-3">{order.buyer_company_name ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3">{order.dispatch_carrier ?? order.shipping_method ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono">{order.tracking_number ?? "—"}</td>
                      <td className="px-4 py-3">{destination(order)}</td>
                      <td className="px-4 py-3"><StatusPill shipment={shipment} /></td>
                      <td className="whitespace-nowrap px-4 py-3">{order.dispatched_at ? formatOrderDate(order.dispatched_at) : "—"}</td>
                      <td className="px-4 py-3"><Actions shipment={shipment} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 xl:hidden">
            {visible.map((shipment) => {
              const { order } = shipment;
              return (
                <li key={order.id} className="rounded-2xl border border-aviation-border bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-aviation-primary">{shipmentNumber(order)}</p>
                      <p className="text-sm text-aviation-muted">{order.po_number ?? "—"} · {order.buyer_company_name ?? "Buyer"}</p>
                    </div>
                    <StatusPill shipment={shipment} />
                  </div>
                  <dl className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2 text-sm">
                    <div><dt className="text-xs uppercase tracking-wide text-aviation-muted">Courier</dt><dd className="font-semibold">{order.dispatch_carrier ?? order.shipping_method ?? "—"}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-aviation-muted">Tracking no.</dt><dd className="break-all font-mono font-semibold">{order.tracking_number ?? "—"}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-aviation-muted">Destination</dt><dd className="font-semibold">{destination(order)}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-aviation-muted">Ship date</dt><dd className="font-semibold">{order.dispatched_at ? formatOrderDate(order.dispatched_at) : "—"}</dd></div>
                  </dl>
                  <div className="mt-3"><Actions shipment={shipment} /></div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
