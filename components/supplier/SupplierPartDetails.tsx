"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";

import {
  getListingLifecycleContext,
  getSupplierPartById,
  transitionListingStatus,
  type ListingLifecycleContext,
  type ListingStatus,
  type Part,
} from "@/lib/parts";
import ListingLifecycleModal from "./ListingLifecycleModal";
import StatusBadge from "@/components/dashboard/StatusBadge";

interface Props {
  partId: string;
}

export default function SupplierPartDetails({
  partId,
}: Props) {
  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);
  const [lifecycle, setLifecycle] = useState<{ action: "inactive" | "archive" | "publish" | "reserve" | "sold"; context: ListingLifecycleContext | null } | null>(null);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);

  useEffect(() => {
    loadPart();
  }, [partId]);

  async function loadPart() {
    setLoading(true);
    const data = await getSupplierPartById(partId);
    setPart(data);
    setLoading(false);
  }

  async function openLifecycle(action: "inactive" | "archive" | "publish" | "reserve" | "sold") {
    if (!part) return;
    try {
      const context = await getListingLifecycleContext(part.id);
      setLifecycle({ action, context });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load listing history.");
    }
  }

  async function confirmLifecycle() {
    if (!part || !lifecycle) return;
    const target: ListingStatus = lifecycle.action === "inactive" ? "Inactive" : lifecycle.action === "archive" ? "Archived" : lifecycle.action === "publish" ? "Published" : lifecycle.action === "reserve" ? "Reserved" : "Sold";
    setLifecycleLoading(true);
    const result = await transitionListingStatus(part.id, target);
    if (!result.success) {
      toast.error(result.error instanceof Error ? result.error.message : "Unable to update listing lifecycle.");
      setLifecycleLoading(false);
      return;
    }
    setPart((current) => current ? { ...current, status: target } : current);
    setLifecycle(null);
    setLifecycleLoading(false);
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow">
        Loading inventory item...
      </div>
    );
  }

  if (!part) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow">
        <h1 className="text-2xl font-bold text-aviation-error">
          Part Not Found
        </h1>
        <p className="mt-2 text-aviation-muted">
          This inventory item does not exist or does not belong to your account.
        </p>
        <Link
          href="/supplier/inventory"
          className="mt-6 inline-flex rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white"
        >
          Back to Inventory
        </Link>
      </div>
    );
  }

  const images = part.image_urls ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/supplier/inventory"
            className="text-sm font-medium text-aviation-primary hover:underline"
          >
            ← Back to Inventory
          </Link>

          <h1 className="mt-3 text-4xl font-bold text-aviation-primary">
            {part.part_number}
          </h1>

          <p className="mt-2 text-aviation-muted">
            {part.manufacturer ?? "Manufacturer not provided"}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <StatusBadge status={part.status} />
          {part.status === "Draft" && <button type="button" onClick={() => openLifecycle("publish")} className="min-h-11 rounded-xl bg-aviation-primary px-4 text-sm font-semibold text-white">Publish</button>}
          {part.status === "Published" && <>
            <button type="button" onClick={() => openLifecycle("inactive")} className="min-h-11 rounded-xl border border-aviation-border px-4 text-sm font-semibold text-aviation-dark">Deactivate</button>
            <button type="button" onClick={() => openLifecycle("reserve")} className="min-h-11 rounded-xl border border-aviation-border px-4 text-sm font-semibold text-aviation-primary">Reserve</button>
            <button type="button" onClick={() => openLifecycle("archive")} className="min-h-11 rounded-xl border border-aviation-border px-4 text-sm font-semibold text-aviation-dark">Archive</button>
          </>}
          {part.status === "Reserved" && <>
            <button type="button" onClick={() => openLifecycle("publish")} className="min-h-11 rounded-xl border border-aviation-border px-4 text-sm font-semibold text-aviation-primary">Release reservation</button>
            <button type="button" onClick={() => openLifecycle("sold")} className="min-h-11 rounded-xl bg-aviation-primary px-4 text-sm font-semibold text-white">Mark sold</button>
          </>}
          {part.status === "Sold" && <button type="button" onClick={() => openLifecycle("archive")} className="min-h-11 rounded-xl border border-aviation-border px-4 text-sm font-semibold text-aviation-dark">Archive</button>}
          {part.status === "Inactive" && <>
            <button type="button" onClick={() => openLifecycle("publish")} className="min-h-11 rounded-xl bg-aviation-primary px-4 text-sm font-semibold text-white">Republish</button>
            <button type="button" onClick={() => openLifecycle("archive")} className="min-h-11 rounded-xl border border-aviation-border px-4 text-sm font-semibold text-aviation-dark">Archive</button>
          </>}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow">
          <div className="relative h-[280px] overflow-hidden rounded-xl bg-aviation-light sm:h-[360px] lg:h-[420px]">
            {images[0] ? (
              <Image
                src={images[0]}
                alt={part.part_number}
                fill
                unoptimized
                className="object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-aviation-muted">
                No Image Available
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {images.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border"
                >
                  <Image
                    src={image}
                    alt={`${part.part_number} ${index + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-2xl font-bold text-aviation-primary">
              Inventory Summary
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Detail label="Description" value={part.description} />
              <Detail label="Condition" value={part.condition} />
              <Detail label="Quantity" value={String(part.quantity)} />
              <Detail label="Pricing" value={part.price_type === "request_quote" ? "Request a Quote" : `${part.currency} ${Number(part.unit_price || 0).toLocaleString()} ${part.price_basis === "lot" ? `per lot (${part.lot_size || "?"} units)` : "per unit"}${part.price_type === "negotiable" ? " · negotiable" : ""}`} />
              <Detail label="Minimum Order" value={String(part.minimum_order_quantity)} />
              <Detail label="Availability" value={part.availability} />
              <Detail label="Incoterms" value={part.incoterms} />
              <Detail label="Payment Terms" value={part.payment_terms} />
              <Detail label="Price Valid Until" value={part.price_valid_until} />
              <Detail label="Stock Location" value={part.stock_location} />
              <Detail label="Lead Time" value={part.lead_time} />
              <Detail label="Category" value={part.category} />
              <Detail label="ATA Chapter" value={part.ata_chapter} />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-2xl font-bold text-aviation-primary">
              Technical & Certification
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Detail label="Serial Number" value={part.serial_number} />
              <Detail label="Aircraft Manufacturer" value={part.aircraft_manufacturer} />
              <Detail label="Aircraft Model" value={part.aircraft_model} />
              <Detail label="Engine Manufacturer" value={part.engine_manufacturer} />
              <Detail label="Engine Model" value={part.engine_model} />
              <Detail label="Trace Certificate" value={part.trace_certificate} />
              <Detail label="TSN" value={part.tsn} />
              <Detail label="TSO" value={part.tso} />
              <Detail label="Shelf Life Expiry" value={part.shelf_life_expiry} />
              <Detail label="Hazmat" value={part.hazmat ? "Yes" : "No"} />
            </div>

            <div className="mt-5">
              <Detail
                label="Maintenance Notes"
                value={part.maintenance_notes}
              />
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-2xl font-bold text-aviation-primary">
          Actions
        </h2>

        <div className="mt-5 flex flex-wrap gap-3">
          {!(["Sold", "Archived"].includes(part.status)) && <Link href={`/supplier/inventory/${part.id}/edit`} className="min-h-11 rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white">Edit Part</Link>}
          {part.status === "Draft" && <button type="button" onClick={() => openLifecycle("publish")} className="min-h-11 rounded-xl border border-aviation-border px-5 py-3 font-semibold text-aviation-primary">Publish</button>}
          {part.status === "Published" && <>
            <button type="button" onClick={() => openLifecycle("inactive")} className="min-h-11 rounded-xl border border-aviation-border px-5 py-3 font-semibold text-aviation-dark">Deactivate</button>
            <button type="button" onClick={() => openLifecycle("reserve")} className="min-h-11 rounded-xl border border-aviation-border px-5 py-3 font-semibold text-aviation-primary">Reserve</button>
            <button type="button" onClick={() => openLifecycle("archive")} className="min-h-11 rounded-xl border border-aviation-border px-5 py-3 font-semibold text-aviation-dark">Archive</button>
          </>}
          {part.status === "Reserved" && <>
            <button type="button" onClick={() => openLifecycle("publish")} className="min-h-11 rounded-xl border border-aviation-border px-5 py-3 font-semibold text-aviation-primary">Release reservation</button>
            <button type="button" onClick={() => openLifecycle("sold")} className="min-h-11 rounded-xl bg-aviation-primary px-5 py-3 font-semibold text-white">Mark sold</button>
            <button type="button" onClick={() => openLifecycle("inactive")} className="min-h-11 rounded-xl border border-aviation-border px-5 py-3 font-semibold text-aviation-dark">Deactivate</button>
          </>}
          {part.status === "Sold" && <button type="button" onClick={() => openLifecycle("archive")} className="min-h-11 rounded-xl border border-aviation-border px-5 py-3 font-semibold text-aviation-dark">Archive</button>}
          {part.status === "Inactive" && <>
            <button type="button" onClick={() => openLifecycle("publish")} className="min-h-11 rounded-xl bg-aviation-primary px-5 py-3 font-semibold text-white">Republish</button>
            <button type="button" onClick={() => openLifecycle("archive")} className="min-h-11 rounded-xl border border-aviation-border px-5 py-3 font-semibold text-aviation-dark">Archive</button>
          </>}
        </div>
      </section>
      {lifecycle && <ListingLifecycleModal open partNumber={part.part_number} action={lifecycle.action} context={lifecycle.context} loading={lifecycleLoading} onCancel={() => !lifecycleLoading && setLifecycle(null)} onConfirm={confirmLifecycle} />}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-sm text-aviation-muted">{label}</p>
      <p className="mt-1 rounded-lg border bg-aviation-light p-3 font-medium">
        {value || "-"}
      </p>
    </div>
  );
}
