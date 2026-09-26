"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  createRFQ,
  type CreateRFQData,
} from "@/lib/rfqs";

import SupplierSelector from "./SupplierSelector";
import AttachmentUpload from "./AttachmentUpload";

export default function CreateRFQForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] =
    useState<CreateRFQData>({
      // Basic Information
      part_number: "",
      description: "",
      quantity: 1,
      required_date: "",

      // Technical Requirements
      preferred_condition: "New",
      certification_required: "",
      ata_chapter: "",
      category: "",

      aircraft_manufacturer: "",
      aircraft_model: "",

      engine_manufacturer: "",
      engine_model: "",

      // Supplier Selection
      distribution_method: "broadcast",

      supplier_ids: [],

      // Files
      attachments: [],

      // Notes
      notes: "",
    });
async function handleSubmit(
  e: React.FormEvent<HTMLFormElement>
) {
  e.preventDefault();

  // Basic Validation

  if (!formData.part_number.trim()) {
    alert("Please enter the Part Number.");
    return;
  }

  if (!formData.description.trim()) {
    alert("Please enter a description.");
    return;
  }

  if (formData.quantity <= 0) {
    alert("Quantity must be greater than zero.");
    return;
  }

  if (
    formData.distribution_method === "selected" &&
    formData.supplier_ids.length === 0
  ) {
    alert(
      "Please select at least one supplier."
    );
    return;
  }

  setLoading(true);

  try {
    const result = await createRFQ(formData);

    if (!result.success) {
      alert(
        result.error ??
          "Unable to create RFQ."
      );
      return;
    }

    alert(
      "Request for Quotation created successfully."
    );

    router.push("/buyer/rfqs");

    router.refresh();

  } catch (error) {

    console.error(error);

    alert(
      "An unexpected error occurred."
    );

  } finally {

    setLoading(false);

  }
}
return (
  <form
    onSubmit={handleSubmit}
    className="space-y-8"
  >

    {/* ========================================================= */}
    {/* General Information */}
    {/* ========================================================= */}

    <section className="rounded-2xl bg-white p-8 shadow">

      <h2 className="mb-8 text-2xl font-bold text-aviation-primary">
        General Information
      </h2>

      <div className="grid gap-6 md:grid-cols-2">

        <div>

          <label className="mb-2 block font-medium">
            Part Number
            <span className="text-aviation-error">
              {" "}*
            </span>
          </label>

          <input
            type="text"
            value={formData.part_number}
            onChange={(e) =>
              setFormData({
                ...formData,
                part_number:
                  e.target.value,
              })
            }
            placeholder="e.g. 65-4488-12"
            className="w-full rounded-xl border border-aviation-border p-3 transition focus:border-aviation-border focus:outline-none"
            required
          />

        </div>

        <div>

          <label className="mb-2 block font-medium">
            Quantity
            <span className="text-aviation-error">
              {" "}*
            </span>
          </label>

          <input
            type="number"
            min={1}
            value={formData.quantity}
            onChange={(e) =>
              setFormData({
                ...formData,
                quantity: Number(
                  e.target.value
                ),
              })
            }
            className="w-full rounded-xl border border-aviation-border p-3 transition focus:border-aviation-border focus:outline-none"
            required
          />

        </div>

      </div>

      <div className="mt-6">

        <label className="mb-2 block font-medium">
          Description
          <span className="text-aviation-error">
            {" "}*
          </span>
        </label>

        <textarea
          rows={5}
          value={formData.description}
          onChange={(e) =>
            setFormData({
              ...formData,
              description:
                e.target.value,
            })
          }
          placeholder="Describe the aircraft part or service required..."
          className="w-full rounded-xl border border-aviation-border p-3 transition focus:border-aviation-border focus:outline-none"
          required
        />

      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">

        <div>

          <label className="mb-2 block font-medium">
            Required Delivery Date
          </label>

          <input
            type="date"
            value={
              formData.required_date
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                required_date:
                  e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border p-3 transition focus:border-aviation-border focus:outline-none"
          />

        </div>

        <div>

          <label className="mb-2 block font-medium">
            Preferred Condition
          </label>

          <select
            value={
              formData.preferred_condition
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                preferred_condition:
                  e.target.value,
              })
            }
            className="w-full rounded-xl border border-aviation-border p-3 transition focus:border-aviation-border focus:outline-none"
          >

            <option value="New">
              New
            </option>

            <option value="New Surplus">
              New Surplus
            </option>

            <option value="Overhauled">
              Overhauled
            </option>

            <option value="Serviceable">
              Serviceable
            </option>

            <option value="As Removed">
              As Removed
            </option>

            <option value="Repairable">
              Repairable
            </option>

          </select>

        </div>

      </div>

    </section>
{/* ========================================================= */}
{/* Supplier Selection */}
{/* ========================================================= */}

<section className="rounded-2xl bg-white p-8 shadow">

  <h2 className="mb-8 text-2xl font-bold text-aviation-primary">
    Supplier Selection
  </h2>

  <div className="space-y-6">

    <div>

      <label className="mb-2 block font-medium">
        Distribution Method
      </label>

      <select
        value={formData.distribution_method}
        onChange={(e) =>
          setFormData({
            ...formData,
            distribution_method: e.target.value as
              "broadcast" | "selected",
          })
        }
        className="w-full rounded-xl border border-aviation-border p-3 transition focus:border-aviation-border focus:outline-none"
      >

        <option value="broadcast">
          Broadcast to all qualified suppliers
        </option>

        <option value="selected">
          Send to selected suppliers only
        </option>

      </select>

      <p className="mt-2 text-sm text-aviation-muted">
        Broadcasting sends this RFQ to all suppliers
        matching your requirements.
      </p>

    </div>

    {formData.distribution_method ===
      "selected" && (

      <SupplierSelector
        selectedSuppliers={
          formData.supplier_ids
        }
        onChange={(supplier_ids) =>
          setFormData({
            ...formData,
            supplier_ids,
          })
        }
      />

    )}

  </div>

</section>
{/* ========================================================= */}
{/* Attachments */}
{/* ========================================================= */}

<section className="rounded-2xl bg-white p-8 shadow">

  <h2 className="mb-8 text-2xl font-bold text-aviation-primary">
    Attachments & Notes
  </h2>

  <AttachmentUpload
    attachments={formData.attachments}
    onChange={(attachments) =>
      setFormData({
        ...formData,
        attachments,
      })
    }
  />

  <div className="mt-8">

    <label className="mb-2 block font-medium">
      Additional Notes
    </label>

    <textarea
      rows={6}
      value={formData.notes}
      onChange={(e) =>
        setFormData({
          ...formData,
          notes: e.target.value,
        })
      }
      placeholder="Additional procurement requirements..."
      className="w-full rounded-xl border border-aviation-border p-4 transition focus:border-aviation-border focus:outline-none"
    />

  </div>

</section>
{/* ========================================================= */}
{/* Actions */}
{/* ========================================================= */}

<div className="flex items-center justify-between rounded-2xl bg-white p-8 shadow">

  <div>

    <h3 className="font-semibold text-aviation-primary">
      Ready to submit?
    </h3>

    <p className="mt-1 text-sm text-aviation-muted">
      Review the information before publishing
      your RFQ.
    </p>

  </div>

  <div className="flex gap-4">

    <button
      type="button"
      onClick={() => router.back()}
      className="rounded-xl border border-aviation-border px-6 py-3 font-medium hover:bg-aviation-light"
    >
      Cancel
    </button>

    <button
      type="button"
      className="rounded-xl border border-aviation-border px-6 py-3 font-semibold text-aviation-primary hover:bg-aviation-light"
    >
      Save Draft
    </button>

    <button
      type="submit"
      disabled={loading}
      className="rounded-xl bg-aviation-primary px-8 py-3 font-semibold text-white transition hover:bg-aviation-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading
        ? "Publishing..."
        : "Publish RFQ"}
    </button>

  </div>

</div>

</form>
 );
}