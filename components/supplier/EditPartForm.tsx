"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AddPartForm from "./AddPartForm";
import { getSupplierPartById } from "@/lib/parts";
import type { PartFormData } from "./types";

interface Props {
  partId: string;
}

export default function EditPartForm({
  partId,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [part, setPart] = useState<PartFormData | null>(null);

  useEffect(() => {
    loadPart();
  }, [partId]);

  async function loadPart() {
    try {
      setLoading(true);

      const data = await getSupplierPartById(partId);

      if (!data) {
        setPart(null);
        return;
      }

      const priceType: PartFormData["priceType"] =
        data.price_type === "fixed" ||
        data.price_type === "negotiable" ||
        data.price_type === "request_quote"
          ? data.price_type
          : "request_quote";

      const priceBasis: PartFormData["priceBasis"] =
        data.price_basis === "lot" ? "lot" : "unit";

      setPart({
        partNumber: data.part_number ?? "",
        alternatePartNumber: data.alternate_part_number ?? "",
        description: data.description ?? "",
        manufacturer: data.manufacturer ?? "",
        serialNumber: data.serial_number ?? "",

        aircraftManufacturer:
          data.aircraft_manufacturer ?? "",

        aircraftModel:
          data.aircraft_model ?? "",

        engineManufacturer:
          data.engine_manufacturer ?? "",

        engineModel:
          data.engine_model ?? "",

        ataChapter:
          data.ata_chapter ?? "",

        category:
          data.category ?? "",

        condition:
          data.condition ?? "New",

        quantity:
          data.quantity ?? 1,

        unitPrice:
          data.unit_price ?? null,

        currency:
          data.currency ?? "USD",

        priceType,

        priceBasis,

        lotSize:
          data.lot_size ?? null,

        minimumOrderQuantity:
          data.minimum_order_quantity ?? 1,

        stockLocation:
          data.stock_location ?? "",

        leadTime:
          data.lead_time ?? "",

        availability:
          data.availability ?? "In stock",

        incoterms:
          data.incoterms ?? "",

        paymentTerms:
          data.payment_terms ?? "",

        priceValidUntil:
          data.price_valid_until ?? "",

        traceCertificate:
          data.trace_certificate ?? "",

        tsn:
          data.tsn ?? "",

        tso:
          data.tso ?? "",

        maintenanceNotes:
          data.maintenance_notes ?? "",

        shelfLifeExpiry:
          data.shelf_life_expiry ?? "",

        hazmat:
          data.hazmat ?? false,

        featured:
          data.featured ?? false,

        status:
          data.status ?? "Draft",

        images: [],
        imageDrafts: [],
        existingImageUrls: data.image_urls ?? [],

        documents: [],
        certificationDocuments: [],
      });
    } catch (error) {
      console.error("Error loading part:", error);
      setPart(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-aviation-border bg-white p-10 text-center shadow-sm">

        <h2 className="text-2xl font-semibold text-aviation-primary">
          Loading inventory record…
        </h2>

        <p className="mt-3 text-aviation-muted">
          Please wait while we retrieve the inventory item.
        </p>

      </div>
    );
  }

  if (!part) {
    return (
      <div className="rounded-2xl border border-aviation-border bg-white p-10 text-center shadow-sm">

        <h2 className="text-2xl font-semibold text-aviation-error">
          Inventory item not found
        </h2>

        <p className="mt-3 text-aviation-muted">
          The requested inventory item could not be found.
        </p>

      </div>
    );
  }

  if (part.status === "Sold" || part.status === "Archived" || part.status === "Reserved") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-aviation-primary">Historical listing</h1>
          <p className="mt-2 text-aviation-muted">{part.status} listings are protected from content edits so the business record remains intact. Release or close the business workflow before creating a materially different listing.</p>
        </div>
        <div className="rounded-2xl border border-aviation-border bg-white p-6 shadow-sm">
          <p className="font-semibold text-aviation-dark">Status: {part.status}</p>
          <p className="mt-2 text-sm leading-6 text-aviation-muted">Use the listing detail page to review the record. Reserved listings can be released, sold listings can only move to Archived, and Archived listings are terminal.</p>
          <Link href={`/supplier/inventory/${partId}`} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-aviation-primary px-5 py-3 font-semibold text-white">View listing</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <div>

        <h1 className="text-4xl font-bold text-aviation-primary">
          Edit Inventory Item
        </h1>

        <p className="mt-2 text-aviation-muted">
          Update the information for this aircraft part.
        </p>

      </div>

      <AddPartForm
        mode="edit"
        partId={partId}
        initialData={part}
      />

    </div>
  );
}