"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PartFormData } from "../types";
import RequiredMark from "@/components/ui/RequiredMark";
import { FormPanel, FormSection, fieldInput, fieldLabel, fieldTextarea } from "@/components/ui/form";

interface Props {
  formData: PartFormData;
  setFormData: Dispatch<SetStateAction<PartFormData>>;
}

export default function GeneralInformation({
  formData,
  setFormData,
}: Props) {
  return (
    <FormPanel>
      <FormSection
        title="General Information"
        text="Enter the basic information about the aircraft part."
      />

      <div className="grid gap-x-5 gap-y-3 md:grid-cols-2">

        {/* Part Number */}
        <div>
          <label className={fieldLabel}>
            Part Number <RequiredMark />
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
            className={fieldInput}
            placeholder="e.g. BACB30NN4K5"
          />
        </div>

        {/* Alternate Part Number */}
        <div>
          <label className={fieldLabel}>
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
            className={fieldInput}
            placeholder="Optional"
          />
        </div>

        {/* Manufacturer */}
        <div>
          <label className={fieldLabel}>
            Manufacturer <RequiredMark />
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
            className={fieldInput}
            placeholder="Boeing, Honeywell, Collins Aerospace..."
          />
        </div>

        {/* Serial Number */}
        <div>
          <label className={fieldLabel}>
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
            className={fieldInput}
            placeholder="Optional"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className={fieldLabel}>
            Description <RequiredMark />
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
            className={fieldTextarea}
            placeholder="Describe the aircraft part, specifications, compatibility, condition and any important information..."
          />
        </div>

      </div>
    </FormPanel>
  );
}
