"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PartFormData } from "../types";
import { FormPanel, FormSection, fieldFile, fieldHint, fieldInput, fieldLabel, fieldSelect, fieldTextarea } from "@/components/ui/form";

interface Props {
  formData: PartFormData;
  setFormData: Dispatch<SetStateAction<PartFormData>>;
}

export default function CertificationSection({
  formData,
  setFormData,
}: Props) {
  return (
    <FormPanel>

      <FormSection
        title="Certification & Traceability"
        text="Provide maintenance history and certification details for this part."
      />

      <div className="grid gap-x-5 gap-y-3 md:grid-cols-2">

        {/* Trace Certificate */}

        <div>
          <label className={fieldLabel}>
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
            className={fieldSelect}
          >
            <option value="">Select Certificate</option>
            <option value="FAA 8130-3">FAA 8130-3</option>
            <option value="EASA Form 1">EASA Form 1</option>
            <option value="Certificate of Conformity">
              Certificate of Conformity
            </option>
            <option value="Maintenance Release">
              Maintenance Release
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
          <label className={fieldLabel}>
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
            className={fieldInput}
            placeholder="Hours"
          />
        </div>

        {/* Time Since Overhaul */}

        <div>
          <label className={fieldLabel}>
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
            className={fieldInput}
            placeholder="Hours"
          />
        </div>

        {/* Certification Upload */}

        <div>
          <label className={fieldLabel}>
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
            className={fieldFile}
          />

          <p className={fieldHint}>
            Upload FAA 8130-3, EASA Form 1, C of C or supporting documentation.
          </p>
        </div>

      </div>

      {/* Maintenance Notes */}

      <div>

        <label className={fieldLabel}>
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
          className={fieldTextarea}
          placeholder="Additional maintenance history, inspections, repair details, storage conditions or other information..."
        />

      </div>

    </FormPanel>
  );
}