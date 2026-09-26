"use client";

import type { RegistrationData } from "@/types/auth";

interface BuyerStep1Props {
  formData: RegistrationData;
  setFormData: React.Dispatch<
    React.SetStateAction<RegistrationData>
  >;
}

export default function BuyerStep1({
  formData,
  setFormData,
}: BuyerStep1Props) {
  return (
    <div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-aviation-primary">
          Personal Information
        </h2>

        <p className="mt-2 text-aviation-muted">
          Tell us about yourself.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {/* Full Name */}

        <div>
          <label className="mb-2 block font-medium">
            Full Name *
          </label>

          <input
            type="text"
            placeholder="John Smith"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({
                ...formData,
                fullName: e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border px-4 py-3 focus:border-aviation-border focus:outline-none"
          />
        </div>

        {/* Email */}

        <div>
          <label className="mb-2 block font-medium">
            Business Email *
          </label>

          <input
            type="email"
            placeholder="john@company.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({
                ...formData,
                email: e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border px-4 py-3 focus:border-aviation-border focus:outline-none"
          />
        </div>

        {/* Phone */}

        <div>
          <label className="mb-2 block font-medium">
            Phone Number *
          </label>

          <input
            type="tel"
            placeholder="+254 700 000 000"
            value={formData.phone}
            onChange={(e) =>
              setFormData({
                ...formData,
                phone: e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border px-4 py-3 focus:border-aviation-border focus:outline-none"
          />
        </div>

        {/* Country */}

        <div>
          <label className="mb-2 block font-medium">
            Country *
          </label>

          <input
            type="text"
            placeholder="Kenya"
            value={formData.country}
            onChange={(e) =>
              setFormData({
                ...formData,
                country: e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border px-4 py-3 focus:border-aviation-border focus:outline-none"
          />
        </div>

      </div>

    </div>
  );
}