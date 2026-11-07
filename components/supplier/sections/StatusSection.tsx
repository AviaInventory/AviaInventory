"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PartFormData } from "../types";
import { FormPanel, FormSection, fieldCheckbox, fieldLabel, fieldSelect } from "@/components/ui/form";

interface Props {
  formData: PartFormData;
  setFormData: Dispatch<SetStateAction<PartFormData>>;
}

export default function StatusSection({
  formData,
  setFormData,
}: Props) {
  return (
    <FormPanel>

      <FormSection
        title="Listing Status"
        text="Choose how this part will appear in the AviaInventory marketplace."
      />

      <div className="grid gap-x-5 gap-y-3 md:grid-cols-2">

        {/* Listing Status */}

        <div>

          <label className={fieldLabel}>
            Status
          </label>

          <select
            value={formData.status}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                status: e.target.value,
              }))
            }
            className={fieldSelect}
          >
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Reserved">Reserved</option>
            <option value="Sold">Sold</option>
            <option value="Inactive">Inactive</option>
          </select>

        </div>

      </div>

      {/* Listing Options */}

      <div className="space-y-2">

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

            <h3 className="text-[13px] font-semibold text-aviation-dark">
              Featured Listing
            </h3>

            <p className="text-xs text-[var(--aviation-muted)]">
              Display this part in the Featured Parts section.
            </p>

          </div>

        </label>

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

            <h3 className="text-[13px] font-semibold text-aviation-dark">
              Hazardous Material
            </h3>

            <p className="text-xs text-[var(--aviation-muted)]">
              Mark this item as hazardous for shipping and handling purposes.
            </p>

          </div>

        </label>

      </div>

      {/* Summary */}

      <div className="rounded-md border border-aviation-border bg-aviation-light p-3 sm:p-4">

        <h3 className="text-[13px] font-bold text-aviation-primary">
          Listing Summary
        </h3>

        <div className="mt-2 grid gap-3 md:grid-cols-2">

          <div>
            <span className="text-xs text-[var(--aviation-muted)]">
              Part Number
            </span>

            <p className="text-[13px] font-medium text-aviation-dark">
              {formData.partNumber || "-"}
            </p>
          </div>

          <div>
            <span className="text-xs text-[var(--aviation-muted)]">
              Manufacturer
            </span>

            <p className="text-[13px] font-medium text-aviation-dark">
              {formData.manufacturer || "-"}
            </p>
          </div>

          <div>
            <span className="text-xs text-[var(--aviation-muted)]">
              Aircraft Model
            </span>

            <p className="text-[13px] font-medium text-aviation-dark">
              {formData.aircraftModel || "-"}
            </p>
          </div>

          <div>
            <span className="text-xs text-[var(--aviation-muted)]">
              Condition
            </span>

            <p className="text-[13px] font-medium text-aviation-dark">
              {formData.condition}
            </p>
          </div>

          <div>
            <span className="text-xs text-[var(--aviation-muted)]">
              Quantity
            </span>

            <p className="text-[13px] font-medium text-aviation-dark">
              {formData.quantity}
            </p>
          </div>

          <div>
            <span className="text-xs text-[var(--aviation-muted)]">
              Price
            </span>

            <p className="text-[13px] font-medium text-aviation-dark">
              {formData.currency} {formData.unitPrice}
            </p>
          </div>

          <div>
            <span className="text-xs text-[var(--aviation-muted)]">
              Images
            </span>

            <p className="text-[13px] font-medium text-aviation-dark">
              {formData.images.length}
            </p>
          </div>

          <div>
            <span className="text-xs text-[var(--aviation-muted)]">
              Documents
            </span>

            <p className="text-[13px] font-medium text-aviation-dark">
              {formData.documents.length}
            </p>
          </div>

        </div>

      </div>

    </FormPanel>
  );
}