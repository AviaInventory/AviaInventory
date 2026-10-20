"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { createQuote } from "@/lib/rfqs";
import type {
  RFQ,
  CreateQuoteData,
} from "@/lib/rfqs";
import RequiredMark from "@/components/ui/RequiredMark";
import { QUOTE_CERTIFICATION_OPTIONS } from "@/lib/rfq-options";

interface Props {
  rfq: RFQ;
}

export default function QuoteForm({
  rfq,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Start from what the buyer asked for, when it is something a supplier can offer.
  const requested = rfq.certification_required?.trim() || "";
  const [certification, setCertification] = useState<string>(
    (QUOTE_CERTIFICATION_OPTIONS as readonly string[]).includes(requested) ? requested : ""
  );

  const initialState: CreateQuoteData = {
    rfq_id: rfq.id,

    // populated by backend
    supplier_id: "",

    buyer_id: rfq.buyer_id,

    unit_price: 0,

    currency: "USD",

    lead_time: "",

    condition:
      rfq.preferred_condition || "New",

    warranty: "",

    valid_until: "",

    certification: [],

    message: "",
  };

  const [formData, setFormData] =
    useState<CreateQuoteData>(initialState);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (formData.unit_price <= 0) {
      toast.error("Enter a valid unit price greater than zero.");
      return;
    }

    if (!formData.lead_time) {
      toast.error("Enter the expected lead time.");
      return;
    }

    if (!certification) {
      toast.error("Choose the certification you will supply, or \"No certification\".");
      return;
    }

    if (!formData.valid_until) {
      toast.error("Select a quotation validity date.");
      return;
    }

    setLoading(true);

    try {
      const result = await createQuote({
        ...formData,
        certification: [certification],
      });

      if (!result.success) {
        toast.error("Unable to submit quotation. Please review the RFQ and try again.");
        return;
      }

      toast.success("Quotation submitted successfully.");

      // Back to the RFQ list. `loading` stays on so the button can't be pressed again
      // while the list loads.
      router.push("/supplier/rfqs");
      router.refresh();
    } catch (error) {
      console.error(error);

      toast.error("Something went wrong while submitting your quotation.");
      setLoading(false);
    }
  }

  return (
    <section id="submit-quote" className="scroll-mt-28 rounded-2xl bg-white p-8 shadow">

      <h2 className="mb-8 text-2xl font-bold text-aviation-primary">
        Submit Quotation
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        {/* Price */}

        <div className="grid gap-6 md:grid-cols-2">

          <div>

            <label className="mb-2 block font-medium">
              Unit Price <RequiredMark />
            </label>

            <input
              type="number"
              min={0}
              step="0.01"
              required
              disabled={loading}
              value={formData.unit_price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  unit_price: Number(e.target.value),
                })
              }
              className="w-full rounded-xl border p-3 disabled:bg-aviation-light"
            />

          </div>

          <div>

            <label className="mb-2 block font-medium">
              Currency
            </label>

            <select
              disabled={loading}
              value={formData.currency}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  currency: e.target.value,
                })
              }
              className="w-full rounded-xl border p-3 disabled:bg-aviation-light"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="KES">KES</option>
            </select>

          </div>

        </div>

        {/* Lead Time & Warranty */}

        <div className="grid gap-6 md:grid-cols-2">

          <div>

            <label className="mb-2 block font-medium">
              Lead Time <RequiredMark />
            </label>

            <input
              type="text"
              required
              disabled={loading}
              value={formData.lead_time}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  lead_time: e.target.value,
                })
              }
              placeholder="e.g. 7 Days"
              className="w-full rounded-xl border p-3 disabled:bg-aviation-light"
            />

          </div>

          <div>

            <label className="mb-2 block font-medium">
              Warranty
            </label>

            <input
              type="text"
              disabled={loading}
              value={formData.warranty}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  warranty: e.target.value,
                })
              }
              placeholder="e.g. 12 Months"
              className="w-full rounded-xl border p-3 disabled:bg-aviation-light"
            />

          </div>

        </div>

        {/* Certification & Validity */}

        <div className="grid gap-6 md:grid-cols-2">

          <div>

            <label htmlFor="quote-certification" className="mb-2 block font-medium">
              Certification supplied <RequiredMark />
            </label>

            <select
              id="quote-certification"
              required
              disabled={loading}
              value={certification}
              onChange={(e) => setCertification(e.target.value)}
              className="w-full rounded-xl border p-3 disabled:bg-aviation-light"
            >
              <option value="">Select certification</option>
              {QUOTE_CERTIFICATION_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            {requested && (
              <p className="mt-1 text-xs text-aviation-muted">
                Buyer requested: <span className="font-semibold text-aviation-dark">{requested}</span>
              </p>
            )}

          </div>

          <div>

            <label className="mb-2 block font-medium">
              Quote Valid Until <RequiredMark />
            </label>

            <input
              type="date"
              required
              disabled={loading}
              value={formData.valid_until}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  valid_until: e.target.value,
                })
              }
              className="w-full rounded-xl border p-3 disabled:bg-aviation-light"
            />

          </div>

        </div>

        {/* Condition */}

        <div>

          <label className="mb-2 block font-medium">
            Condition
          </label>

          <select
            disabled={loading}
            value={formData.condition}
            onChange={(e) =>
              setFormData({
                ...formData,
                condition: e.target.value,
              })
            }
            className="w-full rounded-xl border p-3 disabled:bg-aviation-light"
          >
            <option value="New">New</option>
            <option value="New Surplus">New Surplus</option>
            <option value="Overhauled">Overhauled</option>
            <option value="Serviceable">Serviceable</option>
            <option value="Repaired">Repaired</option>
            <option value="As Removed">As Removed</option>
          </select>

        </div>

        {/* Message */}

        <div>

          <label className="mb-2 block font-medium">
            Supplier Message
          </label>

          <textarea
            rows={5}
            disabled={loading}
            value={formData.message}
            onChange={(e) =>
              setFormData({
                ...formData,
                message: e.target.value,
              })
            }
            placeholder="Provide any additional information for the buyer..."
            className="w-full rounded-xl border p-3 disabled:bg-aviation-light"
          />

        </div>

        {/* Submit */}

        <div className="flex justify-end">

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-aviation-primary px-8 py-3 font-semibold text-white transition hover:bg-aviation-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Submitting Quotation..."
              : "Submit Quotation"}
          </button>

        </div>

      </form>

    </section>
  );
}