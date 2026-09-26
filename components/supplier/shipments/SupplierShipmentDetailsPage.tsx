"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Truck,
  Printer,
  PackageCheck,
} from "lucide-react";

interface Props {
  shipmentId: string;
}

export default function SupplierShipmentDetailsPage({
  shipmentId,
}: Props) {

  const [loading, setLoading] = useState(true);

  const [shipment, setShipment] = useState<any>(null);

  useEffect(() => {

    loadShipment();

  }, []);

  async function loadShipment() {

    // Load from Supabase later

    setShipment(null);

    setLoading(false);

  }

  if (loading) {

    return (

      <div className="rounded-xl bg-white p-10">

        Loading Shipment...

      </div>

    );

  }

  return (

    <div className="space-y-8">
      {/* =======================================
          Header
      ======================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <Link
            href="/supplier/shipments"
            className="mb-4 inline-flex items-center gap-2 text-aviation-primary hover:underline"
          >

            <ArrowLeft size={18} />

            Back to Shipments

          </Link>

          <h1 className="text-3xl font-bold text-aviation-primary">

            Shipment Details

          </h1>

          <p className="mt-2 text-aviation-muted">

            {shipment?.shipment_number ?? "SHP-000001"}

          </p>

        </div>

        <div className="flex gap-3">

          <button className="flex items-center gap-2 rounded-xl border px-5 py-3 hover:bg-aviation-light">

            <Printer size={18} />

            Print Packing List

          </button>

          <button className="flex items-center gap-2 rounded-xl bg-aviation-primary px-5 py-3 text-white hover:bg-aviation-primary">

            <Truck size={18} />

            Update Shipment

          </button>

        </div>

      </div>
      {/* =======================================
          Shipment Summary
      ======================================== */}

      <section className="grid gap-6 lg:grid-cols-4">

        <div className="rounded-2xl bg-white p-6 shadow">

          <p className="text-sm text-aviation-muted">

            Shipment Number

          </p>

          <h3 className="mt-2 text-xl font-bold">

            {shipment?.shipment_number ?? "-"}

          </h3>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow">

          <p className="text-sm text-aviation-muted">

            Purchase Order

          </p>

          <h3 className="mt-2 text-xl font-bold">

            {shipment?.po_number ?? "-"}

          </h3>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow">

          <p className="text-sm text-aviation-muted">

            Courier

          </p>

          <h3 className="mt-2 text-xl font-bold">

            {shipment?.courier ?? "-"}

          </h3>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow">

          <p className="text-sm text-aviation-muted">

            Status

          </p>

          <span className="mt-3 inline-flex rounded-full bg-aviation-success-soft px-3 py-2 font-semibold text-aviation-success">

            {shipment?.status ?? "Pending"}

          </span>

        </div>

      </section>
      {/* =======================================
          Tracking Information
      ======================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-8 text-2xl font-bold text-aviation-primary">

          Tracking Information

        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

          <div>

            <label className="mb-2 block font-medium">

              Courier

            </label>

            <input
              defaultValue={shipment?.courier}
              className="w-full rounded-xl border p-3"
            />

          </div>

          <div>

            <label className="mb-2 block font-medium">

              Tracking Number

            </label>

            <input
              defaultValue={shipment?.tracking_number}
              className="w-full rounded-xl border p-3"
            />

          </div>

          <div>

            <label className="mb-2 block font-medium">

              AWB Number

            </label>

            <input
              defaultValue={shipment?.awb_number}
              className="w-full rounded-xl border p-3"
            />

          </div>

          <div>

            <label className="mb-2 block font-medium">

              Dispatch Date

            </label>

            <input
              type="date"
              defaultValue={shipment?.dispatch_date}
              className="w-full rounded-xl border p-3"
            />

          </div>

        </div>

      </section>
      {/* =======================================
          Shipment Contents
      ======================================== */}

      <section className="rounded-2xl bg-white shadow">

        <div className="border-b p-8">

          <h2 className="text-2xl font-bold text-aviation-primary">
            Shipment Contents
          </h2>

          <p className="mt-2 text-aviation-muted">
            Parts included in this shipment.
          </p>

        </div>

        <div className="overflow-x-auto">

          <div className="aviation-table-wrap"><table className="min-w-full">

            <thead className="bg-aviation-light">

              <tr className="text-left text-sm font-semibold text-aviation-muted">

                <th className="px-6 py-4">
                  Part Number
                </th>

                <th className="px-6 py-4">
                  Description
                </th>

                <th className="px-6 py-4">
                  Serial Number
                </th>

                <th className="px-6 py-4">
                  Qty
                </th>

                <th className="px-6 py-4">
                  Weight
                </th>

              </tr>

            </thead>

            <tbody>

              {(shipment?.items ?? []).length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-aviation-muted"
                  >

                    No shipment items available.

                  </td>

                </tr>

              ) : (

                shipment.items.map((item: any) => (

                  <tr
                    key={item.id}
                    className="border-t"
                  >

                    <td className="px-6 py-5 font-semibold">

                      {item.part_number}

                    </td>

                    <td className="px-6 py-5">

                      {item.description}

                    </td>

                    <td className="px-6 py-5">

                      {item.serial_number ?? "-"}

                    </td>

                    <td className="px-6 py-5">

                      {item.quantity}

                    </td>

                    <td className="px-6 py-5">

                      {item.weight ?? "-"} kg

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table></div>

        </div>

      </section>
      {/* =======================================
          Packing Information
      ======================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-8 text-2xl font-bold text-aviation-primary">
          Packing Information
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

          <div>

            <label className="mb-2 block font-medium">
              Number of Packages
            </label>

            <input
              type="number"
              defaultValue={shipment?.package_count}
              className="w-full rounded-xl border p-3"
            />

          </div>

          <div>

            <label className="mb-2 block font-medium">
              Total Weight (kg)
            </label>

            <input
              type="number"
              defaultValue={shipment?.total_weight}
              className="w-full rounded-xl border p-3"
            />

          </div>

          <div>

            <label className="mb-2 block font-medium">
              Dimensions
            </label>

            <input
              defaultValue={shipment?.dimensions}
              placeholder="120 × 80 × 60 cm"
              className="w-full rounded-xl border p-3"
            />

          </div>

          <div>

            <label className="mb-2 block font-medium">
              Packaging Type
            </label>

            <select
              defaultValue={shipment?.package_type}
              className="w-full rounded-xl border p-3"
            >

              <option>Box</option>
              <option>Wooden Crate</option>
              <option>Pallet</option>
              <option>Container</option>
              <option>Flight Case</option>

            </select>

          </div>

        </div>

      </section>
      {/* =======================================
          Shipping Documents
      ======================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-8 text-2xl font-bold text-aviation-primary">
          Shipping Documents
        </h2>

        <div className="rounded-xl border-2 border-dashed border-aviation-border p-8">

          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
            className="w-full"
          />

          <p className="mt-4 text-sm text-aviation-muted">

            Upload Air Waybill, Packing List,
            Commercial Invoice, Export Permit,
            Certificate of Origin, Customs Documents
            and any other shipment documentation.

          </p>

        </div>

      </section>
      {/* =======================================
          Shipment Timeline
      ======================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-8 text-2xl font-bold text-aviation-primary">
          Shipment Timeline
        </h2>

        <div className="space-y-6">

          <div className="flex gap-4">

            <div className="mt-1 h-4 w-4 rounded-full bg-aviation-success"></div>

            <div>

              <h3 className="font-semibold">
                Order Packed
              </h3>

              <p className="text-sm text-aviation-muted">
                Shipment has been packed and is ready for dispatch.
              </p>

            </div>

          </div>

          <div className="flex gap-4">

            <div className="mt-1 h-4 w-4 rounded-full bg-aviation-success"></div>

            <div>

              <h3 className="font-semibold">
                Dispatched
              </h3>

              <p className="text-sm text-aviation-muted">
                Shipment handed over to courier.
              </p>

            </div>

          </div>

          <div className="flex gap-4">

            <div className="mt-1 h-4 w-4 rounded-full bg-aviation-light"></div>

            <div>

              <h3 className="font-semibold">
                Delivered
              </h3>

              <p className="text-sm text-aviation-muted">
                Waiting for delivery confirmation.
              </p>

            </div>

          </div>

        </div>

      </section>
      {/* =======================================
          Delivery Confirmation
      ======================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-8 text-2xl font-bold text-aviation-primary">
          Delivery Confirmation
        </h2>

        <div className="grid gap-6 md:grid-cols-2">

          <div>

            <label className="mb-2 block font-medium">
              Delivery Status
            </label>

            <select
              defaultValue={shipment?.status}
              className="w-full rounded-xl border p-3"
            >

              <option>Pending</option>
              <option>Packed</option>
              <option>Dispatched</option>
              <option>In Transit</option>
              <option>Delivered</option>

            </select>

          </div>

          <div>

            <label className="mb-2 block font-medium">
              Delivery Date
            </label>

            <input
              type="date"
              className="w-full rounded-xl border p-3"
            />

          </div>

        </div>

        <div className="mt-8">

          <label className="mb-2 block font-medium">
            Delivery Notes
          </label>

          <textarea
            rows={4}
            className="w-full rounded-xl border p-3"
            placeholder="Enter delivery remarks..."
          />

        </div>

      </section>
      {/* =======================================
          Proof of Delivery
      ======================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-8 text-2xl font-bold text-aviation-primary">
          Proof of Delivery
        </h2>

        <div className="rounded-xl border-2 border-dashed border-aviation-border p-8">

          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            className="w-full"
          />

          <p className="mt-4 text-sm text-aviation-muted">
            Upload signed delivery notes, photographs,
            customer acknowledgement or proof of delivery.
          </p>

        </div>

      </section>
      {/* =======================================
          Actions
      ======================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">

          <Link
            href="/supplier/shipments"
            className="rounded-xl border border-aviation-border px-6 py-3 font-semibold text-center hover:bg-aviation-light"
          >
            Cancel
          </Link>

          <button
            className="rounded-xl bg-aviation-primary px-8 py-3 font-semibold text-white hover:bg-aviation-primary"
          >
            Save Shipment
          </button>

          <button
            className="rounded-xl bg-aviation-success px-8 py-3 font-semibold text-white hover:bg-aviation-success"
          >
            Mark as Delivered
          </button>

        </div>

      </section>

    </div>

  );

}