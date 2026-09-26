"use client";

import type { RegistrationData } from "@/types/auth";

interface BuyerStep2Props {
  formData: RegistrationData;
  setFormData: React.Dispatch<
    React.SetStateAction<RegistrationData>
  >;
}

export default function BuyerStep2({
  formData,
  setFormData,
}: BuyerStep2Props) {
  return (
    <div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-aviation-primary">
          Company Information
        </h2>

        <p className="mt-2 text-aviation-muted">
          Tell us about your organization.
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
            className="w-full rounded-xl border border-aviation-border px-4 py-3 focus:border-aviation-border focus:outline-none"
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
            className="w-full rounded-xl border border-aviation-border px-4 py-3 focus:border-aviation-border focus:outline-none"
          >
            <option value="">Select Business Type</option>
            <option>Airline</option>
            <option>MRO</option>
            <option>Aircraft Operator</option>
            <option>Flight School</option>
            <option>Government</option>
            <option>Aircraft Broker</option>
            <option>Parts Distributor</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Job Title
          </label>

          <input
            type="text"
            value={formData.jobTitle}
            onChange={(e) =>
              setFormData({
                ...formData,
                jobTitle: e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border px-4 py-3 focus:border-aviation-border focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Company Website
          </label>

          <input
            type="url"
            placeholder="https://"
            value={formData.website}
            onChange={(e) =>
              setFormData({
                ...formData,
                website: e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border px-4 py-3 focus:border-aviation-border focus:outline-none"
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
            className="w-full rounded-xl border border-aviation-border px-4 py-3 focus:border-aviation-border focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            City
          </label>

          <input
            type="text"
            value={formData.city}
            onChange={(e) =>
              setFormData({
                ...formData,
                city: e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border px-4 py-3 focus:border-aviation-border focus:outline-none"
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
          className="w-full rounded-xl border border-aviation-border px-4 py-3 focus:border-aviation-border focus:outline-none"
        />
      </div>

    </div>
  );
}