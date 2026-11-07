"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PartFormData } from "../types";
import { FormPanel, FormSection, fieldCheckbox, fieldInput, fieldLabel, fieldSelect } from "@/components/ui/form";
import { numberInputValue, parseNumberInput } from "@/lib/number-input";

interface Props {
  formData: PartFormData;
  setFormData: Dispatch<SetStateAction<PartFormData>>;
}

export default function InventoryDetails({
  formData,
  setFormData,
}: Props) {
  return (
    <FormPanel>

      <FormSection
        title="Inventory Details"
        text="Enter inventory, pricing and availability information for this part."
      />

      <div className="grid gap-x-5 gap-y-3 md:grid-cols-2">

        {/* Condition */}

        <div>

          <label className={fieldLabel}>
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
            className={fieldSelect}
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

          <label className={fieldLabel}>
            Quantity Available
          </label>

          <input
            type="number"
            min={1}
            value={numberInputValue(formData.quantity)}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                quantity: parseNumberInput(e.target.value),
              }))
            }
            className={fieldInput}
          />

        </div>

        {/* Pricing */}
        <div>
          <label className={fieldLabel}>Pricing Method</label>
          <select value={formData.priceType} onChange={(e) => setFormData((prev) => ({ ...prev, priceType: e.target.value as PartFormData["priceType"], unitPrice: e.target.value === "request_quote" ? null : (prev.unitPrice ?? 0) }))} className={fieldSelect}>
            <option value="fixed">Fixed price</option><option value="negotiable">Negotiable price</option><option value="request_quote">Request quote</option>
          </select>
        </div>
        <div>
          <label className={fieldLabel}>Price Basis</label>
          <select value={formData.priceBasis} onChange={(e) => setFormData((prev) => ({ ...prev, priceBasis: e.target.value as PartFormData["priceBasis"], lotSize: e.target.value === "unit" ? null : (prev.lotSize ?? 1) }))} className={fieldSelect}>
            <option value="unit">Per unit</option><option value="lot">Per lot</option>
          </select>
        </div>
        {formData.priceType !== "request_quote" && <div>
          <label className={fieldLabel}>{formData.priceBasis === "lot" ? "Lot Price" : "Price"}</label>
          <input type="number" min={0} step="0.01" value={formData.unitPrice ?? ""} onChange={(e) => setFormData((prev) => ({ ...prev, unitPrice: e.target.value === "" ? null : Number(e.target.value) }))} className={`${fieldInput} font-mono`} placeholder="0.00" />
        </div>}
        {formData.priceBasis === "lot" && <div>
          <label className={fieldLabel}>Units per Lot</label>
          <input type="number" min={1} value={formData.lotSize ?? ""} onChange={(e) => setFormData((prev) => ({ ...prev, lotSize: e.target.value === "" ? null : Number(e.target.value) }))} className={`${fieldInput} font-mono`} />
        </div>}
        <div>
          <label className={fieldLabel}>Minimum Order Quantity</label>
          <input type="number" min={1} value={numberInputValue(formData.minimumOrderQuantity)} onChange={(e) => setFormData((prev) => ({ ...prev, minimumOrderQuantity: parseNumberInput(e.target.value) }))} className={`${fieldInput} font-mono`} />
        </div>
        <div>
          <label className={fieldLabel}>Currency</label>
          <select value={formData.currency} onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))} className={fieldSelect}><option>USD</option><option>EUR</option><option>GBP</option><option>KES</option><option>AED</option><option>ZAR</option></select>
        </div>
        {/* Stock Location */}

        <div>

          <label className={fieldLabel}>
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
            className={fieldInput}
            placeholder="Nairobi, Kenya"
          />

        </div>

        {/* Lead Time */}

        <div>

          <label className={fieldLabel}>
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
            className={fieldInput}
            placeholder="Available Immediately"
          />

        </div>

        <div className="md:col-span-2 mt-1 rounded-md border border-aviation-border bg-aviation-light p-3 sm:p-4">
          <h3 className="text-[13px] font-bold text-aviation-dark">Advanced commercial terms</h3>
          <div className="mt-2 grid gap-x-4 gap-y-3 md:grid-cols-3">
            <div><label className={fieldLabel}>Availability</label><select value={formData.availability} onChange={(e) => setFormData((prev) => ({ ...prev, availability: e.target.value }))} className={fieldSelect}><option>In stock</option><option>Limited stock</option><option>On request</option><option>Made to order</option></select></div>
            <div><label className={fieldLabel}>Incoterms</label><input value={formData.incoterms} onChange={(e) => setFormData((prev) => ({ ...prev, incoterms: e.target.value }))} className={fieldInput} placeholder="FCA Nairobi, Kenya" /></div>
            <div><label className={fieldLabel}>Payment Terms</label><input value={formData.paymentTerms} onChange={(e) => setFormData((prev) => ({ ...prev, paymentTerms: e.target.value }))} className={fieldInput} placeholder="Net 30" /></div>
            <div><label className={fieldLabel}>Price Valid Until</label><input type="date" value={formData.priceValidUntil} onChange={(e) => setFormData((prev) => ({ ...prev, priceValidUntil: e.target.value }))} className={fieldInput} /></div>
          </div>
        </div>

        {/* Shelf Life */}

        <div>

          <label className={fieldLabel}>
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
            className={fieldInput}
          />

        </div>

      </div>

      {/* Checkboxes */}

      <div className="grid gap-x-5 gap-y-2 md:grid-cols-2">

        <label className="flex cursor-pointer items-start gap-2">

          <input
            className={`${fieldCheckbox} mt-0.5`}
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

            <p className="text-[13px] font-semibold text-aviation-dark">
              Hazardous Material
            </p>

            <p className="text-xs text-[var(--aviation-muted)]">
              Tick if this item is classified as hazardous.
            </p>

          </div>

        </label>

        <label className="flex cursor-pointer items-start gap-2">

          <input
            className={`${fieldCheckbox} mt-0.5`}
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

            <p className="text-[13px] font-semibold text-aviation-dark">
              Featured Listing
            </p>

            <p className="text-xs text-[var(--aviation-muted)]">
              Highlight this listing in the marketplace.
            </p>

          </div>

        </label>

        <div className="md:col-span-2 mt-1 rounded-md border border-aviation-border bg-aviation-light p-3 sm:p-4">
          <h3 className="text-[13px] font-bold text-aviation-dark">Advanced commercial terms</h3>
          <div className="mt-2 grid gap-x-4 gap-y-3 md:grid-cols-3">
            <div><label className={fieldLabel}>Availability</label><select value={formData.availability} onChange={(e) => setFormData((prev) => ({ ...prev, availability: e.target.value }))} className={fieldSelect}><option>In stock</option><option>Limited stock</option><option>On request</option><option>Made to order</option></select></div>
            <div><label className={fieldLabel}>Incoterms</label><input value={formData.incoterms} onChange={(e) => setFormData((prev) => ({ ...prev, incoterms: e.target.value }))} className={fieldInput} placeholder="FCA Nairobi, Kenya" /></div>
            <div><label className={fieldLabel}>Payment Terms</label><input value={formData.paymentTerms} onChange={(e) => setFormData((prev) => ({ ...prev, paymentTerms: e.target.value }))} className={fieldInput} placeholder="Net 30" /></div>
            <div><label className={fieldLabel}>Price Valid Until</label><input type="date" value={formData.priceValidUntil} onChange={(e) => setFormData((prev) => ({ ...prev, priceValidUntil: e.target.value }))} className={fieldInput} /></div>
          </div>
        </div>
      </div>

    </FormPanel>
  );
}