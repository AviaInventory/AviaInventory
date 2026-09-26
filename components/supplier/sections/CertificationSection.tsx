"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PartFormData } from "../types";

interface Props {
  formData: PartFormData;
  setFormData: Dispatch<SetStateAction<PartFormData>>;
}

export default function CertificationSection({
  formData,
  setFormData,
}: Props) {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm">

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-aviation-primary">
          Certification & Traceability
        </h2>

        <p className="mt-2 text-aviation-muted">
          Provide maintenance history and certification details for this part.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {/* Trace Certificate */}

        <div>
          <label className="mb-2 block font-medium">
            Trace Certificate
          </label>

          <select
            value={formData.traceCertificate}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                traceCertificate: e.target.value,
              }))
            }
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
          >
            <option value="">Select Certificate</option>
            <option value="FAA 8130-3">FAA 8130-3</option>
            <option value="EASA Form 1">EASA Form 1</option>
            <option value="Certificate of Conformity">
              Certificate of Conformity
            </option>
            <option value="Dual Release">
              Dual Release
            </option>
            <option value="OEM Certificate">
              OEM Certificate
            </option>
            <option value="Other">
              Other
            </option>
          </select>
        </div>

        {/* Time Since New */}

        <div>
          <label className="mb-2 block font-medium">
            Time Since New (TSN)
          </label>

          <input
            type="number"
            min="0"
            value={formData.tsn}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                tsn: e.target.value,
              }))
            }
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
            placeholder="Hours"
          />
        </div>

        {/* Time Since Overhaul */}

        <div>
          <label className="mb-2 block font-medium">
            Time Since Overhaul (TSO)
          </label>

          <input
            type="number"
            min="0"
            value={formData.tso}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                tso: e.target.value,
              }))
            }
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
            placeholder="Hours"
          />
        </div>

        {/* Certification Upload */}

        <div>
          <label className="mb-2 block font-medium">
            Certification Documents
          </label>

          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                documents: e.target.files
                  ? Array.from(e.target.files)
                  : [],
              }))
            }
            className="w-full rounded-xl border p-3"
          />

          <p className="mt-2 text-sm text-aviation-muted">
            Upload FAA 8130-3, EASA Form 1, C of C or supporting documentation.
          </p>
        </div>

      </div>

      {/* Maintenance Notes */}

      <div className="mt-6">

        <label className="mb-2 block font-medium">
          Maintenance Notes
        </label>

        <textarea
          rows={5}
          value={formData.maintenanceNotes}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              maintenanceNotes: e.target.value,
            }))
          }
          className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
          placeholder="Additional maintenance history, inspections, repair details, storage conditions or other information..."
        />

      </div>

    </section>
  );
}