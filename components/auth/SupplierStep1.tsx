"use client";

import type { RegistrationData } from "@/types/auth";

interface SupplierStep1Props {
  formData: RegistrationData;
  setFormData: React.Dispatch<
    React.SetStateAction<RegistrationData>
  >;
}

export default function SupplierStep1({
  formData,
  setFormData,
}: SupplierStep1Props) {
  return (
    <div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-aviation-primary">
          Supplier Contact Information
        </h2>

        <p className="mt-2 text-aviation-muted">
          Tell buyers who they will be dealing with.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">

        <div>
          <label className="mb-2 block font-medium">
            Full Name *
          </label>

          <input
            type="text"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({
                ...formData,
                fullName: e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Business Email *
          </label>

          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({
                ...formData,
                email: e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Phone Number *
          </label>

          <input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({
                ...formData,
                phone: e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Job Title *
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
            className="w-full rounded-xl border border-aviation-border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Country *
          </label>

          <input
            type="text"
            value={formData.country}
            onChange={(e) =>
              setFormData({
                ...formData,
                country: e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border px-4 py-3"
          />
        </div>

      </div>

    </div>
  );
}