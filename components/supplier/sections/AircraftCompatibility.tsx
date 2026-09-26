"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PartFormData } from "../types";

interface Props {
  formData: PartFormData;
  setFormData: Dispatch<SetStateAction<PartFormData>>;
}

export default function AircraftCompatibility({
  formData,
  setFormData,
}: Props) {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm">

      <div className="mb-6">

        <h2 className="text-2xl font-bold text-aviation-primary">
          Aircraft Compatibility
        </h2>

        <p className="mt-2 text-aviation-muted">
          Specify the aircraft, engine and ATA chapter that this part supports.
        </p>

      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {/* Aircraft Manufacturer */}

        <div>

          <label className="mb-2 block font-medium">
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
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
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

          <label className="mb-2 block font-medium">
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
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
          />

        </div>

        {/* Engine Manufacturer */}

        <div>

          <label className="mb-2 block font-medium">
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
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
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

          <label className="mb-2 block font-medium">
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
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
          />

        </div>

        {/* ATA Chapter */}

        <div>

          <label className="mb-2 block font-medium">
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
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
          />

        </div>

        {/* Category */}

        <div>

          <label className="mb-2 block font-medium">
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
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
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

    </section>
  );
}