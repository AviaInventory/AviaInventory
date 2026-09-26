"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PartFormData } from "../types";

interface Props {
  formData: PartFormData;
  setFormData: Dispatch<SetStateAction<PartFormData>>;
}

export default function StatusSection({
  formData,
  setFormData,
}: Props) {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm">

      <div className="mb-6">

        <h2 className="text-2xl font-bold text-aviation-primary">
          Listing Status
        </h2>

        <p className="mt-2 text-aviation-muted">
          Choose how this part will appear in the AviaInventory marketplace.
        </p>

      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {/* Listing Status */}

        <div>

          <label className="mb-2 block font-medium">
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
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
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

      <div className="mt-8 space-y-4">

        <label className="flex items-center gap-4 rounded-xl border p-4">

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

            <h3 className="font-semibold">
              Featured Listing
            </h3>

            <p className="text-sm text-aviation-muted">
              Display this part in the Featured Parts section.
            </p>

          </div>

        </label>

        <label className="flex items-center gap-4 rounded-xl border p-4">

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

            <h3 className="font-semibold">
              Hazardous Material
            </h3>

            <p className="text-sm text-aviation-muted">
              Mark this item as hazardous for shipping and handling purposes.
            </p>

          </div>

        </label>

      </div>

      {/* Summary */}

      <div className="mt-10 rounded-2xl bg-aviation-light p-6">

        <h3 className="text-lg font-semibold text-aviation-primary">
          Listing Summary
        </h3>

        <div className="mt-4 grid gap-4 md:grid-cols-2">

          <div>
            <span className="text-sm text-aviation-muted">
              Part Number
            </span>

            <p className="font-medium">
              {formData.partNumber || "-"}
            </p>
          </div>

          <div>
            <span className="text-sm text-aviation-muted">
              Manufacturer
            </span>

            <p className="font-medium">
              {formData.manufacturer || "-"}
            </p>
          </div>

          <div>
            <span className="text-sm text-aviation-muted">
              Aircraft Model
            </span>

            <p className="font-medium">
              {formData.aircraftModel || "-"}
            </p>
          </div>

          <div>
            <span className="text-sm text-aviation-muted">
              Condition
            </span>

            <p className="font-medium">
              {formData.condition}
            </p>
          </div>

          <div>
            <span className="text-sm text-aviation-muted">
              Quantity
            </span>

            <p className="font-medium">
              {formData.quantity}
            </p>
          </div>

          <div>
            <span className="text-sm text-aviation-muted">
              Price
            </span>

            <p className="font-medium">
              {formData.currency} {formData.unitPrice}
            </p>
          </div>

          <div>
            <span className="text-sm text-aviation-muted">
              Images
            </span>

            <p className="font-medium">
              {formData.images.length}
            </p>
          </div>

          <div>
            <span className="text-sm text-aviation-muted">
              Documents
            </span>

            <p className="font-medium">
              {formData.documents.length}
            </p>
          </div>

        </div>

      </div>

    </section>
  );
}