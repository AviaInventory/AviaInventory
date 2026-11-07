"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PartFormData } from "../types";
import { FormPanel, FormSection, fieldInput, fieldLabel, fieldSelect } from "@/components/ui/form";

interface Props {
  formData: PartFormData;
  setFormData: Dispatch<SetStateAction<PartFormData>>;
}

export default function AircraftCompatibility({
  formData,
  setFormData,
}: Props) {
  return (
    <FormPanel>

      <FormSection
        title="Aircraft Compatibility"
        text="Specify the aircraft, engine and ATA chapter that this part supports."
      />

      <div className="grid gap-x-5 gap-y-3 md:grid-cols-2">

        {/* Aircraft Manufacturer */}

        <div>

          <label className={fieldLabel}>
            Aircraft Manufacturer
          </label>

          <select
            value={formData.aircraftManufacturer}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                aircraftManufacturer: e.target.value,
              }))
            }
            className={fieldSelect}
          >
            <option value="">Select Manufacturer</option>
            <option>Boeing</option>
            <option>Airbus</option>
            <option>Embraer</option>
            <option>Bombardier</option>
            <option>Cessna</option>
            <option>Beechcraft</option>
            <option>ATR</option>
            <option>Dassault</option>
            <option>Gulfstream</option>
            <option>Pilatus</option>
            <option>Other</option>
          </select>

        </div>

        {/* Aircraft Model */}

        <div>

          <label className={fieldLabel}>
            Aircraft Model
          </label>

          <input
            type="text"
            value={formData.aircraftModel}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                aircraftModel: e.target.value,
              }))
            }
            placeholder="B737-800"
            className={fieldInput}
          />

        </div>

        {/* Engine Manufacturer */}

        <div>

          <label className={fieldLabel}>
            Engine Manufacturer
          </label>

          <select
            value={formData.engineManufacturer}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                engineManufacturer: e.target.value,
              }))
            }
            className={fieldSelect}
          >
            <option value="">Select Manufacturer</option>
            <option>GE Aerospace</option>
            <option>Pratt & Whitney</option>
            <option>Rolls-Royce</option>
            <option>Safran</option>
            <option>Honeywell</option>
            <option>Other</option>
          </select>

        </div>

        {/* Engine Model */}

        <div>

          <label className={fieldLabel}>
            Engine Model
          </label>

          <input
            type="text"
            value={formData.engineModel}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                engineModel: e.target.value,
              }))
            }
            placeholder="CFM56-7B"
            className={fieldInput}
          />

        </div>

        {/* ATA Chapter */}

        <div>

          <label className={fieldLabel}>
            ATA Chapter
          </label>

          <input
            type="text"
            value={formData.ataChapter}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                ataChapter: e.target.value,
              }))
            }
            placeholder="27 - Flight Controls"
            className={fieldInput}
          />

        </div>

        {/* Category */}

        <div>

          <label className={fieldLabel}>
            Category
          </label>

          <select
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                category: e.target.value,
              }))
            }
            className={fieldSelect}
          >
            <option value="">Select Category</option>
            <option>Airframe</option>
            <option>Engine</option>
            <option>Avionics</option>
            <option>Landing Gear</option>
            <option>Hydraulics</option>
            <option>Electrical</option>
            <option>Consumables</option>
            <option>Tools</option>
            <option>Other</option>
          </select>

        </div>

      </div>

    </FormPanel>
  );
}