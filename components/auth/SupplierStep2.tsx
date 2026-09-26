"use client";

import type { RegistrationData } from "@/types/auth";

interface SupplierStep2Props {
  formData: RegistrationData;
  setFormData: React.Dispatch<
    React.SetStateAction<RegistrationData>
  >;
}

export default function SupplierStep2({
  formData,
  setFormData,
}: SupplierStep2Props) {
  return (
    <div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-aviation-primary">
          Company Information
        </h2>

        <p className="mt-2 text-aviation-muted">
          Tell buyers about your business.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">

        <div>
          <label className="mb-2 block font-medium">
            Company Name *
          </label>

          <input
            type="text"
            value={formData.companyName}
            onChange={(e) =>
              setFormData({
                ...formData,
                companyName: e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Business Type *
          </label>

          <select
            value={formData.businessType}
            onChange={(e) =>
              setFormData({
                ...formData,
                businessType: e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border px-4 py-3"
          >
            <option value="">Select</option>
            <option>OEM</option>
            <option>Aircraft Parts Distributor</option>
            <option>MRO</option>
            <option>Aircraft Dismantler</option>
            <option>Airline</option>
            <option>Aircraft Broker</option>
            <option>Engine Shop</option>
            <option>Avionics Shop</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Website
          </label>

          <input
            type="url"
            value={formData.website}
            onChange={(e) =>
              setFormData({
                ...formData,
                website: e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Registration Number
          </label>

          <input
            type="text"
            value={formData.registrationNumber}
            onChange={(e) =>
              setFormData({
                ...formData,
                registrationNumber: e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border px-4 py-3"
          />
        </div>

      </div>

      <div className="mt-6">

        <label className="mb-2 block font-medium">
          Company Address
        </label>

        <textarea
          rows={4}
          value={formData.address}
          onChange={(e) =>
            setFormData({
              ...formData,
              address: e.target.value,
            })
          }
          className="w-full rounded-xl border border-aviation-border px-4 py-3"
        />

      </div>

    </div>
  );
}