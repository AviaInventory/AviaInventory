"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PartFormData } from "../types";

interface Props {
  formData: PartFormData;
  setFormData: Dispatch<SetStateAction<PartFormData>>;
}

export default function InventoryDetails({
  formData,
  setFormData,
}: Props) {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm">

      <div className="mb-6">

        <h2 className="text-2xl font-bold text-aviation-primary">
          Inventory Details
        </h2>

        <p className="mt-2 text-aviation-muted">
          Enter inventory, pricing and availability information for this part.
        </p>

      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {/* Condition */}

        <div>

          <label className="mb-2 block font-medium">
            Condition
          </label>

          <select
            value={formData.condition}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                condition: e.target.value,
              }))
            }
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
          >
            <option>New</option>
            <option>Overhauled</option>
            <option>Serviceable</option>
            <option>As Removed</option>
            <option>Repairable</option>
          </select>

        </div>

        {/* Quantity */}

        <div>

          <label className="mb-2 block font-medium">
            Quantity Available
          </label>

          <input
            type="number"
            min={1}
            value={formData.quantity}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                quantity: Number(e.target.value),
              }))
            }
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
          />

        </div>

        {/* Pricing */}
        <div>
          <label className="mb-2 block font-medium">Pricing Method</label>
          <select value={formData.priceType} onChange={(e) => setFormData((prev) => ({ ...prev, priceType: e.target.value as PartFormData["priceType"], unitPrice: e.target.value === "request_quote" ? null : (prev.unitPrice ?? 0) }))} className="w-full rounded-xl border p-3">
            <option value="fixed">Fixed price</option><option value="negotiable">Negotiable price</option><option value="request_quote">Request quote</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block font-medium">Price Basis</label>
          <select value={formData.priceBasis} onChange={(e) => setFormData((prev) => ({ ...prev, priceBasis: e.target.value as PartFormData["priceBasis"], lotSize: e.target.value === "unit" ? null : (prev.lotSize ?? 1) }))} className="w-full rounded-xl border p-3">
            <option value="unit">Per unit</option><option value="lot">Per lot</option>
          </select>
        </div>
        {formData.priceType !== "request_quote" && <div>
          <label className="mb-2 block font-medium">{formData.priceBasis === "lot" ? "Lot Price" : "Price"}</label>
          <input type="number" min={0} step="0.01" value={formData.unitPrice ?? ""} onChange={(e) => setFormData((prev) => ({ ...prev, unitPrice: e.target.value === "" ? null : Number(e.target.value) }))} className="w-full rounded-xl border p-3 font-mono" placeholder="0.00" />
        </div>}
        {formData.priceBasis === "lot" && <div>
          <label className="mb-2 block font-medium">Units per Lot</label>
          <input type="number" min={1} value={formData.lotSize ?? ""} onChange={(e) => setFormData((prev) => ({ ...prev, lotSize: e.target.value === "" ? null : Number(e.target.value) }))} className="w-full rounded-xl border p-3 font-mono" />
        </div>}
        <div>
          <label className="mb-2 block font-medium">Minimum Order Quantity</label>
          <input type="number" min={1} value={formData.minimumOrderQuantity} onChange={(e) => setFormData((prev) => ({ ...prev, minimumOrderQuantity: Number(e.target.value) }))} className="w-full rounded-xl border p-3 font-mono" />
        </div>
        <div>
          <label className="mb-2 block font-medium">Currency</label>
          <select value={formData.currency} onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))} className="w-full rounded-xl border p-3"><option>USD</option><option>EUR</option><option>GBP</option><option>KES</option><option>AED</option><option>ZAR</option></select>
        </div>
        {/* Stock Location */}

        <div>

          <label className="mb-2 block font-medium">
            Stock Location
          </label>

          <input
            type="text"
            value={formData.stockLocation}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                stockLocation: e.target.value,
              }))
            }
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
            placeholder="Nairobi, Kenya"
          />

        </div>

        {/* Lead Time */}

        <div>

          <label className="mb-2 block font-medium">
            Lead Time
          </label>

          <input
            type="text"
            value={formData.leadTime}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                leadTime: e.target.value,
              }))
            }
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
            placeholder="Available Immediately"
          />

        </div>

        <div className="md:col-span-2 mt-2 rounded-xl border border-aviation-border bg-aviation-light p-5">
          <h3 className="font-bold text-aviation-dark">Advanced commercial terms</h3>
          <div className="mt-4 grid gap-5 md:grid-cols-3">
            <div><label className="mb-2 block font-medium">Availability</label><select value={formData.availability} onChange={(e) => setFormData((prev) => ({ ...prev, availability: e.target.value }))} className="w-full rounded-xl border p-3"><option>In stock</option><option>Limited stock</option><option>On request</option><option>Made to order</option></select></div>
            <div><label className="mb-2 block font-medium">Incoterms</label><input value={formData.incoterms} onChange={(e) => setFormData((prev) => ({ ...prev, incoterms: e.target.value }))} className="w-full rounded-xl border p-3" placeholder="FCA Nairobi, Kenya" /></div>
            <div><label className="mb-2 block font-medium">Payment Terms</label><input value={formData.paymentTerms} onChange={(e) => setFormData((prev) => ({ ...prev, paymentTerms: e.target.value }))} className="w-full rounded-xl border p-3" placeholder="Net 30" /></div>
            <div><label className="mb-2 block font-medium">Price Valid Until</label><input type="date" value={formData.priceValidUntil} onChange={(e) => setFormData((prev) => ({ ...prev, priceValidUntil: e.target.value }))} className="w-full rounded-xl border p-3" /></div>
          </div>
        </div>

        {/* Shelf Life */}

        <div>

          <label className="mb-2 block font-medium">
            Shelf Life Expiry
          </label>

          <input
            type="date"
            value={formData.shelfLifeExpiry}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                shelfLifeExpiry: e.target.value,
              }))
            }
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
          />

        </div>

      </div>

      {/* Checkboxes */}

      <div className="mt-8 grid gap-4 md:grid-cols-2">

        <label className="flex items-center gap-3 rounded-xl border p-4">

          <input
            type="checkbox"
            checked={formData.hazmat}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                hazmat: e.target.checked,
              }))
            }
          />

          <div>

            <p className="font-medium">
              Hazardous Material
            </p>

            <p className="text-sm text-aviation-muted">
              Tick if this item is classified as hazardous.
            </p>

          </div>

        </label>

        <label className="flex items-center gap-3 rounded-xl border p-4">

          <input
            type="checkbox"
            checked={formData.featured}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                featured: e.target.checked,
              }))
            }
          />

          <div>

            <p className="font-medium">
              Featured Listing
            </p>

            <p className="text-sm text-aviation-muted">
              Highlight this listing in the marketplace.
            </p>

          </div>

        </label>

        <div className="md:col-span-2 mt-2 rounded-xl border border-aviation-border bg-aviation-light p-5">
          <h3 className="font-bold text-aviation-dark">Advanced commercial terms</h3>
          <div className="mt-4 grid gap-5 md:grid-cols-3">
            <div><label className="mb-2 block font-medium">Availability</label><select value={formData.availability} onChange={(e) => setFormData((prev) => ({ ...prev, availability: e.target.value }))} className="w-full rounded-xl border p-3"><option>In stock</option><option>Limited stock</option><option>On request</option><option>Made to order</option></select></div>
            <div><label className="mb-2 block font-medium">Incoterms</label><input value={formData.incoterms} onChange={(e) => setFormData((prev) => ({ ...prev, incoterms: e.target.value }))} className="w-full rounded-xl border p-3" placeholder="FCA Nairobi, Kenya" /></div>
            <div><label className="mb-2 block font-medium">Payment Terms</label><input value={formData.paymentTerms} onChange={(e) => setFormData((prev) => ({ ...prev, paymentTerms: e.target.value }))} className="w-full rounded-xl border p-3" placeholder="Net 30" /></div>
            <div><label className="mb-2 block font-medium">Price Valid Until</label><input type="date" value={formData.priceValidUntil} onChange={(e) => setFormData((prev) => ({ ...prev, priceValidUntil: e.target.value }))} className="w-full rounded-xl border p-3" /></div>
          </div>
        </div>
      </div>

    </section>
  );
}