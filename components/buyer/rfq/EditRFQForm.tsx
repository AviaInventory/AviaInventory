"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getRFQById,
  updateRFQ,
  type CreateRFQData,
} from "@/lib/rfqs";

import SupplierSelector from "./SupplierSelector";
import AttachmentUpload from "./AttachmentUpload";

interface Props {
  rfqId: string;
}

export default function EditRFQForm({
  rfqId,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] =
    useState<CreateRFQData>({
      part_number: "",
      description: "",
      quantity: 1,
      required_date: "",
      preferred_condition: "New",
      certification_required: "",
      ata_chapter: "",
      category: "",
      aircraft_manufacturer: "",
      aircraft_model: "",
      engine_manufacturer: "",
      engine_model: "",
      delivery_location: "",
      notes: "",
      distribution_method: "broadcast",
      supplier_ids: [],
      attachments: [],
    });

  useEffect(() => {
    loadRFQ();
  }, []);

  async function loadRFQ() {
    const result = await getRFQById(rfqId);

    if (!result.success || !result.data) {
      alert("Unable to load RFQ.");
      router.push("/buyer/rfqs");
      return;
    }

    const rfq = result.data as any;

    setFormData({
      part_number: rfq.part_number ?? rfq.part?.part_number ?? "",
      description: rfq.description ?? "",
      quantity: rfq.quantity,
      required_date: rfq.required_date ?? "",
      preferred_condition: rfq.preferred_condition ?? "",
      certification_required:
        rfq.certification_required ?? "",
      ata_chapter: rfq.ata_chapter ?? "",
      category: rfq.category ?? "",
      aircraft_manufacturer:
        rfq.aircraft_manufacturer ?? "",
      aircraft_model:
        rfq.aircraft_model ?? "",
      engine_manufacturer:
        rfq.engine_manufacturer ?? "",
      engine_model:
        rfq.engine_model ?? "",
      delivery_location:
        rfq.delivery_location ?? "",
      notes: rfq.notes ?? "",
      distribution_method:
        rfq.distribution_method,
      supplier_ids:
        rfq.supplier_ids ?? [],
      attachments:
        rfq.attachments ?? [],
    });

    setLoading(false);
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setSaving(true);

    const result = await updateRFQ(
      rfqId,
      formData
    );

    setSaving(false);

    if (!result.success) {
      alert("Unable to update RFQ.");
      return;
    }

    alert("RFQ updated successfully.");

    router.push(`/buyer/rfqs/${rfqId}`);
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow">
        Loading RFQ...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >

      <section className="rounded-2xl bg-white p-8 shadow">

        <h1 className="mb-8 text-3xl font-bold text-aviation-primary">
          Edit RFQ
        </h1>

        <div className="grid gap-6 md:grid-cols-2">

          <div>
            <label className="mb-2 block font-medium">
              Part Number
            </label>

            <input
              value={formData.part_number}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  part_number:
                    e.target.value,
                })
              }
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Quantity
            </label>

            <input
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: Number(
                    e.target.value
                  ),
                })
              }
              className="w-full rounded-xl border p-3"
            />
          </div>

        </div>

        <div className="mt-6">

          <label className="mb-2 block font-medium">
            Description
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
            className="w-full rounded-xl border p-3"
          />

        </div>

      </section>

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-6 text-2xl font-bold text-aviation-primary">
          Suppliers
        </h2>

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

      </section>

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-6 text-2xl font-bold text-aviation-primary">
          Attachments
        </h2>

        <AttachmentUpload
          attachments={
            formData.attachments
          }
          onChange={(attachments) =>
            setFormData({
              ...formData,
              attachments,
            })
          }
        />

      </section>

      <div className="flex justify-end gap-4">

        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="rounded-xl border px-6 py-3"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-aviation-primary px-8 py-3 font-semibold text-white"
        >
          {saving
            ? "Saving..."
            : "Update RFQ"}
        </button>

      </div>

    </form>
  );
}