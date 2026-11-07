"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { createQuote } from "@/lib/rfqs";
import type {
  RFQ,
  CreateQuoteData,
} from "@/lib/rfqs";
import { Send } from "lucide-react";
import { FieldGroup, FormCard, FormFooter, FormRow, FormSection, btnPrimary, fieldInput, fieldSelect, fieldTextarea } from "@/components/ui/form";
import { QUOTE_CERTIFICATION_OPTIONS } from "@/lib/rfq-options";
import { numberInputValue, parseNumberInput } from "@/lib/number-input";

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
        // Expired / already quoted / closed RFQs come back with a message the supplier should see.
        toast.error(
          typeof result.error === "string"
            ? result.error
            : "Unable to submit quotation. Please review the RFQ and try again."
        );
        setLoading(false);
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
    <section id="submit-quote" className="scroll-mt-28">
      <FormCard icon={Send} title="Submit Quotation" subtitle="Your price, lead time and certification for this RFQ.">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <FormSection title="Price" />

          <FormRow label="Unit Price" htmlFor="quote-unit-price" required>
            <FieldGroup>
              <input
                id="quote-unit-price"
                type="number"
                min={0}
                step="0.01"
                required
                disabled={loading}
                value={numberInputValue(formData.unit_price)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unit_price: parseNumberInput(e.target.value),
                  })
                }
                className={fieldInput}
              />
              <select
                id="quote-currency"
                aria-label="Currency"
                disabled={loading}
                value={formData.currency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currency: e.target.value,
                  })
                }
                className={fieldSelect}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="KES">KES</option>
              </select>
            </FieldGroup>
          </FormRow>

          <FormSection title="Terms" />

          <FormRow label="Lead Time" htmlFor="quote-lead-time" required>
            <input
              id="quote-lead-time"
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
              className={fieldInput}
            />
          </FormRow>

          <FormRow label="Warranty" htmlFor="quote-warranty">
            <input
              id="quote-warranty"
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
              className={fieldInput}
            />
          </FormRow>

          <FormRow
            label="Certification supplied"
            htmlFor="quote-certification"
            required
            hint={requested ? <>Buyer requested: <span className="font-semibold not-italic text-aviation-dark">{requested}</span></> : undefined}
          >
            <select
              id="quote-certification"
              required
              disabled={loading}
              value={certification}
              onChange={(e) => setCertification(e.target.value)}
              className={fieldSelect}
            >
              <option value="">Select certification</option>
              {QUOTE_CERTIFICATION_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormRow>

          <FormRow label="Quote Valid Until" htmlFor="quote-valid-until" required>
            <input
              id="quote-valid-until"
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
              className={`${fieldInput} sm:max-w-[200px]`}
            />
          </FormRow>

          <FormRow label="Condition" htmlFor="quote-condition">
            <select
              id="quote-condition"
              disabled={loading}
              value={formData.condition}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  condition: e.target.value,
                })
              }
              className={fieldSelect}
            >
              <option value="New">New</option>
              <option value="New Surplus">New Surplus</option>
              <option value="Overhauled">Overhauled</option>
              <option value="Serviceable">Serviceable</option>
              <option value="Repaired">Repaired</option>
              <option value="As Removed">As Removed</option>
            </select>
          </FormRow>

          <FormSection title="Message" />

          <FormRow label="Supplier Message" htmlFor="quote-message" optional>
            <textarea
              id="quote-message"
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
              className={fieldTextarea}
            />
          </FormRow>

          <FormFooter>
            <button type="submit" disabled={loading} className={btnPrimary}>
              <Send size={15} aria-hidden="true" />
              {loading
                ? "Submitting Quotation..."
                : "Submit Quotation"}
            </button>
          </FormFooter>
        </form>
      </FormCard>
    </section>
  );
}
