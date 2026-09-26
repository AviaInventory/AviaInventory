"use client";

import type { RegistrationData } from "@/types/auth";

interface SupplierStep4Props {
  formData: RegistrationData;
  setFormData: React.Dispatch<
    React.SetStateAction<RegistrationData>
  >;
}

export default function SupplierStep4({
  formData,
  setFormData,
}: SupplierStep4Props) {
  return (
    <div>

      {/* Header */}

      <div className="mb-10">

        <h2 className="text-3xl font-bold text-aviation-primary">
          Security & Confirmation
        </h2>

        <p className="mt-2 text-aviation-muted">
          Create a secure password to protect your AviaInventory account.
        </p>

      </div>

      <div className="space-y-6">

        {/* Password */}

        <div>

          <label className="mb-2 block font-medium">
            Password *
          </label>

          <input
            type="password"
            placeholder="Create a strong password"
            value={formData.password}
            onChange={(e) =>
              setFormData({
                ...formData,
                password: e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border px-4 py-3 focus:border-aviation-border focus:outline-none"
          />

        </div>

        {/* Confirm Password */}

        <div>

          <label className="mb-2 block font-medium">
            Confirm Password *
          </label>

          <input
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({
                ...formData,
                confirmPassword: e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border px-4 py-3 focus:border-aviation-border focus:outline-none"
          />

        </div>

        {/* Terms */}

        <label className="flex items-start gap-3 rounded-xl border border-aviation-border p-4">

          <input
            type="checkbox"
            checked={formData.agreeTerms}
            onChange={(e) =>
              setFormData({
                ...formData,
                agreeTerms: e.target.checked,
              })
            }
            className="mt-1"
          />

          <span className="text-sm text-aviation-muted">
            I agree to the AviaInventory Terms of Service and Privacy Policy.
          </span>

        </label>

        {/* Newsletter */}

        <label className="flex items-start gap-3 rounded-xl border border-aviation-border p-4">

          <input
            type="checkbox"
            checked={formData.subscribeNewsletter}
            onChange={(e) =>
              setFormData({
                ...formData,
                subscribeNewsletter: e.target.checked,
              })
            }
            className="mt-1"
          />

          <span className="text-sm text-aviation-muted">
            Keep me informed about new marketplace features, buyer requests,
            aviation industry updates, and AviaInventory news.
          </span>

        </label>

        {/* Information Box */}

        <div className="rounded-2xl bg-aviation-success-soft p-5">

          <h3 className="font-semibold text-aviation-primary">
            Before you continue
          </h3>

          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-aviation-dark">
            <li>Your supplier profile will be reviewed by AviaInventory.</li>
            <li>You can update your inventory at any time.</li>
            <li>Your company profile can be edited after registration.</li>
            <li>You will receive buyer RFQs directly from your dashboard.</li>
          </ul>

        </div>

      </div>

    </div>
  );
}