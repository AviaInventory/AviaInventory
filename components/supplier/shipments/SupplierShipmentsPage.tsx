"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

import {
  Search,
  Eye,
  Truck,
  MapPinned,
  Package,
} from "lucide-react";

export default function SupplierShipmentsPage() {

  const [loading, setLoading] = useState(true);

  const [shipments, setShipments] = useState<any[]>([]);

  useEffect(() => {
    loadShipments();
  }, []);

  async function loadShipments() {

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setShipments([]); setLoading(false); return; }
    const { data, error } = await supabase.from("supplier_shipments").select("*").eq("supplier_id", user.id).order("created_at", { ascending: false });
    if (error) console.error("GET SUPPLIER SHIPMENTS ERROR:", error);
    setShipments(data ?? []);
    setLoading(false);

  }

  return (

    <div className="space-y-8">

      <div>

        <h1 className="text-3xl font-bold text-aviation-primary">
          Shipments
        </h1>

        <p className="mt-2 text-aviation-muted">
          Manage customer shipments and track deliveries.
        </p>

      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl bg-white p-6 shadow">

          <p className="text-aviation-muted">
            Total Shipments
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {shipments.length}
          </h2>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow">

          <p className="text-aviation-muted">
            In Transit
          </p>

          <h2 className="mt-2 text-3xl font-bold text-aviation-success">

            {
              shipments.filter(
                s => s.status === "In Transit"
              ).length
            }

          </h2>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow">

          <p className="text-aviation-muted">
            Delivered
          </p>

          <h2 className="mt-2 text-3xl font-bold text-aviation-success">

            {
              shipments.filter(
                s => s.status === "Delivered"
              ).length
            }

          </h2>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow">

          <p className="text-aviation-muted">
            Pending Dispatch
          </p>

          <h2 className="mt-2 text-3xl font-bold text-aviation-warning">

            {
              shipments.filter(
                s => s.status === "Pending"
              ).length
            }

          </h2>

        </div>

      </div>
      {/* =======================================
          Search & Filters
      ======================================== */}

      <section className="rounded-2xl bg-white p-6 shadow">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="relative w-full lg:max-w-md">

            <Search
              size={18}
              className="absolute left-3 top-3 text-aviation-muted"
            />

            <input
              type="text"
              placeholder="Search Shipment, Tracking or Customer..."
              className="w-full rounded-xl border py-3 pl-10 pr-4"
            />

          </div>

          <select className="rounded-xl border px-4 py-3">

            <option>All Statuses</option>
            <option>Pending</option>
            <option>Packed</option>
            <option>Dispatched</option>
            <option>In Transit</option>
            <option>Delivered</option>

          </select>

        </div>

      </section>
      {/* =======================================
          Shipments Table
      ======================================== */}

      <section className="overflow-hidden rounded-2xl bg-white shadow">

        <div className="overflow-x-auto">

          <div className="aviation-table-wrap"><table className="min-w-full">

            <thead className="bg-aviation-light">

              <tr className="text-left text-sm font-semibold text-aviation-muted">

                <th className="px-6 py-4">Shipment #</th>

                <th className="px-6 py-4">PO Number</th>

                <th className="px-6 py-4">Buyer</th>

                <th className="px-6 py-4">Courier</th>

                <th className="px-6 py-4">Tracking No.</th>

                <th className="px-6 py-4">Destination</th>

                <th className="px-6 py-4">Status</th>

                <th className="px-6 py-4">Ship Date</th>

                <th className="px-6 py-4 text-center">

                  Actions

                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center"
                  >

                    Loading shipment records...

                  </td>

                </tr>

              ) : shipments.length === 0 ? (

                <tr>

                  <td
                    colSpan={9}
                    className="px-6 py-16 text-center"
                  >

                    <Package
                      size={48}
                      className="mx-auto mb-4 text-aviation-muted"
                    />

                    <h3 className="text-lg font-semibold">

                      No Shipments Found

                    </h3>

                    <p className="mt-2 text-aviation-muted">

                      Shipments created from purchase orders will appear here.

                    </p>

                  </td>

                </tr>

              ) : (

                shipments.map((shipment) => (

                  <tr
                    key={shipment.id}
                    className="border-t hover:bg-aviation-light"
                  >

                    <td className="px-6 py-5 font-semibold">

                      {shipment.shipment_number}

                    </td>

                    <td className="px-6 py-5">

                      {shipment.po_number}

                    </td>

                    <td className="px-6 py-5">

                      {shipment.customer_name}

                    </td>

                    <td className="px-6 py-5">

                      {shipment.courier}

                    </td>

                    <td className="px-6 py-5">

                      {shipment.tracking_number}

                    </td>

                    <td className="px-6 py-5">

                      {shipment.destination}

                    </td>
                    <td className="px-6 py-5">

                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold
                        ${
                          shipment.status === "Pending"
                            ? "bg-aviation-warning-soft text-aviation-warning"
                            : shipment.status === "Packed"
                            ? "bg-aviation-success-soft text-aviation-success"
                            : shipment.status === "Dispatched"
                            ? "bg-aviation-light text-aviation-primary"
                            : shipment.status === "In Transit"
                            ? "bg-cyan-100 text-cyan-700"
                            : shipment.status === "Delivered"
                            ? "bg-aviation-success-soft text-aviation-success"
                            : "bg-aviation-light text-aviation-dark"
                        }`}
                      >

                        {shipment.status}

                      </span>

                    </td>

                    <td className="px-6 py-5">

                      {shipment.ship_date}

                    </td>

                    <td className="px-6 py-5">

                      <div className="flex justify-center gap-2">

                        <Link
                          href={`/supplier/shipments/${shipment.id}`}
                          className="rounded-lg border p-2 hover:bg-aviation-light"
                          title="View Shipment"
                        >

                          <Eye size={18} />

                        </Link>

                        <button
                          className="rounded-lg border p-2 hover:bg-aviation-light"
                          title="Update Shipment"
                        >

                          <Truck size={18} />

                        </button>

                        <button
                          className="rounded-lg border p-2 hover:bg-aviation-light"
                          title="Tracking"
                        >

                          <MapPinned size={18} />

                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table></div>

        </div>

      </section>

    </div>

  );

}
