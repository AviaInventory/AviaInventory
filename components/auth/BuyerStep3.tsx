"use client";

import type { RegistrationData } from "@/types/auth";

interface BuyerStep3Props {
  formData: RegistrationData;
  setFormData: React.Dispatch<
    React.SetStateAction<RegistrationData>
  >;
}

export default function BuyerStep3({
  formData,
  setFormData,
}: BuyerStep3Props) {
  return (
    <div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-aviation-primary">
          Security & Confirmation
        </h2>

        <p className="mt-2 text-aviation-muted">
          Secure your AviaInventory account.
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
            value={formData.password}
            onChange={(e) =>
              setFormData({
                ...formData,
                password: e.target.value,
              })
            }
            placeholder="Create a strong password"
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
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({
                ...formData,
                confirmPassword: e.target.value,
              })
            }
            placeholder="Confirm your password"
            className="w-full rounded-xl border border-aviation-border px-4 py-3 focus:border-aviation-border focus:outline-none"
          />
        </div>

        {/* Terms */}

        <label className="flex items-start gap-3">

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
            I agree to the Terms & Conditions and Privacy Policy.
          </span>

        </label>

        {/* Newsletter */}

        <label className="flex items-start gap-3">

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
            Send me AviaInventory product updates and marketplace news.
          </span>

        </label>

      </div>

    </div>
  );
}