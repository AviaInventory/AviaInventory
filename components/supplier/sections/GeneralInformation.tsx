"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PartFormData } from "../types";

interface Props {
  formData: PartFormData;
  setFormData: Dispatch<SetStateAction<PartFormData>>;
}

export default function GeneralInformation({
  formData,
  setFormData,
}: Props) {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm">

      <div className="mb-6">

        <h2 className="text-2xl font-bold text-aviation-primary">
          General Information
        </h2>

        <p className="mt-2 text-aviation-muted">
          Enter the basic information about the aircraft part.
        </p>

      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {/* Part Number */}

        <div>

          <label className="mb-2 block font-medium">
            Part Number *
          </label>

          <input
            type="text"
            value={formData.partNumber}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                partNumber: e.target.value,
              }))
            }
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
            placeholder="e.g. BACB30NN4K5"
          />

        </div>

        {/* Alternate Part Number */}

        <div>

          <label className="mb-2 block font-medium">
            Alternate Part Number
          </label>

          <input
            type="text"
            value={formData.alternatePartNumber}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                alternatePartNumber: e.target.value,
              }))
            }
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
            placeholder="Optional"
          />

        </div>

        {/* Manufacturer */}

        <div>

          <label className="mb-2 block font-medium">
            Manufacturer *
          </label>

          <input
            type="text"
            value={formData.manufacturer}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                manufacturer: e.target.value,
              }))
            }
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
            placeholder="Boeing, Honeywell, Collins Aerospace..."
          />

        </div>

        {/* Serial Number */}

        <div>

          <label className="mb-2 block font-medium">
            Serial Number
          </label>

          <input
            type="text"
            value={formData.serialNumber}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                serialNumber: e.target.value,
              }))
            }
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
            placeholder="Optional"
          />

        </div>

      </div>

      {/* Description */}

      <div className="mt-6">

        <label className="mb-2 block font-medium">
          Description *
        </label>

        <textarea
          rows={5}
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
          placeholder="Describe the aircraft part, specifications, compatibility, condition and any important information..."
        />

      </div>

    </section>
  );
}