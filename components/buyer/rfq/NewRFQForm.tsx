"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  createRFQ,
  uploadRFQAttachment,
  type CreateRFQData,
} from "@/lib/rfqs";

import SupplierSelector from "./SupplierSelector";

export default function NewRFQForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<CreateRFQData>({
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
    distribution_method: "selected",
    supplier_ids: [],
    attachments: [],
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  function updateField(
    field: keyof CreateRFQData,
    value: string | number
  ) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleFileSelection(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? []);

    setSelectedFiles((prev) => [
      ...prev,
      ...files,
    ]);

    event.target.value = "";
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) =>
      prev.filter(
        (_, fileIndex) => fileIndex !== index
      )
    );
  }

  async function uploadAttachments(): Promise<string[]> {
    if (!selectedFiles.length) {
      return [];
    }

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of selectedFiles) {
        const result =
          await uploadRFQAttachment(file);

        if (
          !result.success ||
          !result.url
        ) {
          throw new Error(
            result.error ||
              `Failed to upload ${file.name}`
          );
        }

        uploadedUrls.push(result.url);
      }

      return uploadedUrls;
    } finally {
      setUploading(false);
    }
  }

  function validateForm(): string | null {
    if (!formData.part_number.trim()) {
      return "Please enter the part number.";
    }

    if (!formData.description.trim()) {
      return "Please enter a description.";
    }

    if (
      !Number.isFinite(
        Number(formData.quantity)
      ) ||
      Number(formData.quantity) <= 0
    ) {
      return "Please enter a valid quantity.";
    }

    if (!formData.required_date) {
      return "Please select the required date.";
    }

    const selectedDate = new Date(
      `${formData.required_date}T00:00:00`
    );

    if (
      Number.isNaN(
        selectedDate.getTime()
      )
    ) {
      return "Please enter a valid required date.";
    }

    if (!formData.preferred_condition) {
      return "Please select the preferred condition.";
    }

    if (
      !formData.certification_required.trim()
    ) {
      return "Please specify the certification requirement.";
    }

    if (
      !formData.delivery_location?.trim()
    ) {
      return "Please enter the delivery location.";
    }

    if (
      !formData.supplier_ids ||
      formData.supplier_ids.length !== 1
    ) {
      return "Please select exactly one supplier.";
    }

    return null;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      alert(validationError);
      return;
    }

    if (loading || uploading) {
      return;
    }

    setLoading(true);

    try {
      const attachmentUrls =
        await uploadAttachments();

      const payload: CreateRFQData = {
        ...formData,

        part_number:
          formData.part_number.trim(),

        description:
          formData.description.trim(),

        quantity: Number(
          formData.quantity
        ),

        required_date:
          formData.required_date,

        preferred_condition:
          formData.preferred_condition,

        certification_required:
          formData.certification_required.trim(),

        ata_chapter:
          formData.ata_chapter?.trim() ||
          "",

        category:
          formData.category?.trim() ||
          "",

        aircraft_manufacturer:
          formData.aircraft_manufacturer?.trim() ||
          "",

        aircraft_model:
          formData.aircraft_model?.trim() ||
          "",

        engine_manufacturer:
          formData.engine_manufacturer?.trim() ||
          "",

        engine_model:
          formData.engine_model?.trim() ||
          "",

        delivery_location:
          formData.delivery_location?.trim() ||
          "",

        notes:
          formData.notes?.trim() ||
          "",

        distribution_method:
          formData.distribution_method,

        supplier_ids:
          formData.distribution_method ===
          "selected"
            ? formData.supplier_ids
            : [],

        attachments:
          attachmentUrls,
      };

      const result =
        await createRFQ(payload);

      if (!result.success) {
        alert(
          typeof result.error ===
            "string"
            ? result.error
            : "Unable to create the RFQ."
        );

        return;
      }

      alert(
        "RFQ created successfully."
      );

      router.push("/buyer/rfqs");
      router.refresh();
    } catch (error) {
      console.error(
        "CREATE RFQ ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the RFQ."
      );
    } finally {
      setLoading(false);
    }
  }

  const disabled =
    loading || uploading;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >

      {/* =====================================================
          PART INFORMATION
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-2 text-2xl font-bold text-aviation-primary">
          Part Information
        </h2>

        <p className="mb-8 text-sm text-aviation-muted">
          Provide the details of the aviation part you require.
        </p>

        <div className="grid gap-6 md:grid-cols-2">

          <Field
            label="Part Number"
            required
          >
            <input
              type="text"
              required
              disabled={disabled}
              value={formData.part_number}
              onChange={(e) =>
                updateField(
                  "part_number",
                  e.target.value
                )
              }
              placeholder="e.g. 123-45678-001"
              className={inputClass}
            />
          </Field>

          <Field label="Category">
            <select
              disabled={disabled}
              value={formData.category}
              onChange={(e) =>
                updateField(
                  "category",
                  e.target.value
                )
              }
              className={inputClass}
            >
              <option value="">
                Select category
              </option>

              <option value="Airframe">
                Airframe
              </option>

              <option value="Engine">
                Engine
              </option>

              <option value="Avionics">
                Avionics
              </option>

              <option value="Landing Gear">
                Landing Gear
              </option>

              <option value="Propeller">
                Propeller
              </option>

              <option value="Electrical">
                Electrical
              </option>

              <option value="Consumables">
                Consumables
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </Field>

        </div>

        <div className="mt-6">

          <Field
            label="Description"
            required
          >
            <textarea
              required
              rows={4}
              disabled={disabled}
              value={formData.description}
              onChange={(e) =>
                updateField(
                  "description",
                  e.target.value
                )
              }
              placeholder="Describe the part or item you require..."
              className={inputClass}
            />
          </Field>

        </div>

      </section>

      {/* =====================================================
          AIRCRAFT / ENGINE INFORMATION
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-2 text-2xl font-bold text-aviation-primary">
          Aircraft & Engine Information
        </h2>

        <p className="mb-8 text-sm text-aviation-muted">
          Provide aircraft or engine information where applicable.
        </p>

        <div className="grid gap-6 md:grid-cols-2">

          <Field label="Aircraft Manufacturer">
            <input
              type="text"
              disabled={disabled}
              value={
                formData.aircraft_manufacturer
              }
              onChange={(e) =>
                updateField(
                  "aircraft_manufacturer",
                  e.target.value
                )
              }
              placeholder="e.g. Boeing"
              className={inputClass}
            />
          </Field>

          <Field label="Aircraft Model">
            <input
              type="text"
              disabled={disabled}
              value={
                formData.aircraft_model
              }
              onChange={(e) =>
                updateField(
                  "aircraft_model",
                  e.target.value
                )
              }
              placeholder="e.g. 737-800"
              className={inputClass}
            />
          </Field>

          <Field label="Engine Manufacturer">
            <input
              type="text"
              disabled={disabled}
              value={
                formData.engine_manufacturer
              }
              onChange={(e) =>
                updateField(
                  "engine_manufacturer",
                  e.target.value
                )
              }
              placeholder="e.g. CFM International"
              className={inputClass}
            />
          </Field>

          <Field label="Engine Model">
            <input
              type="text"
              disabled={disabled}
              value={
                formData.engine_model
              }
              onChange={(e) =>
                updateField(
                  "engine_model",
                  e.target.value
                )
              }
              placeholder="e.g. CFM56-7B"
              className={inputClass}
            />
          </Field>

          <Field label="ATA Chapter">
            <input
              type="text"
              disabled={disabled}
              value={
                formData.ata_chapter
              }
              onChange={(e) =>
                updateField(
                  "ata_chapter",
                  e.target.value
                )
              }
              placeholder="e.g. 32"
              className={inputClass}
            />
          </Field>

        </div>

      </section>

      {/* =====================================================
          REQUIREMENTS
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-2 text-2xl font-bold text-aviation-primary">
          Requirements
        </h2>

        <p className="mb-8 text-sm text-aviation-muted">
          Specify quantity, condition, certification and delivery
          requirements.
        </p>

        <div className="grid gap-6 md:grid-cols-2">

          <Field
            label="Quantity"
            required
          >
            <input
              type="number"
              min="1"
              required
              disabled={disabled}
              value={formData.quantity}
              onChange={(e) =>
                updateField(
                  "quantity",
                  Number(
                    e.target.value
                  )
                )
              }
              className={inputClass}
            />
          </Field>

          <Field
            label="Required Date"
            required
          >
            <input
              type="date"
              required
              disabled={disabled}
              min={
                new Date()
                  .toISOString()
                  .split("T")[0]
              }
              value={
                formData.required_date
              }
              onChange={(e) =>
                updateField(
                  "required_date",
                  e.target.value
                )
              }
              className={inputClass}
            />
          </Field>

          <Field
            label="Preferred Condition"
            required
          >
            <select
              required
              disabled={disabled}
              value={
                formData.preferred_condition
              }
              onChange={(e) =>
                updateField(
                  "preferred_condition",
                  e.target.value
                )
              }
              className={inputClass}
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

              <option value="Repaired">
                Repaired
              </option>

              <option value="As Removed">
                As Removed
              </option>

              <option value="Any">
                Any Condition
              </option>
            </select>
          </Field>

          <Field
            label="Certification Required"
            required
          >
            <input
              type="text"
              required
              disabled={disabled}
              value={
                formData.certification_required
              }
              onChange={(e) =>
                updateField(
                  "certification_required",
                  e.target.value
                )
              }
              placeholder="e.g. FAA 8130-3 / EASA Form 1"
              className={inputClass}
            />
          </Field>

          <Field
            label="Delivery Location"
            required
          >
            <input
              type="text"
              required
              disabled={disabled}
              value={
                formData.delivery_location
              }
              onChange={(e) =>
                updateField(
                  "delivery_location",
                  e.target.value
                )
              }
              placeholder="e.g. Nairobi, Kenya"
              className={inputClass}
            />
          </Field>

        </div>

      </section>

      {/* =====================================================
          SUPPLIER
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">
        <h2 className="mb-2 text-2xl font-bold text-aviation-primary">
          Supplier
        </h2>

        <p className="mb-6 text-sm text-aviation-muted">
          Select the supplier that should receive this RFQ.
          The current RFQ database stores one supplier per request.
        </p>

        <SupplierSelector
          selectedSuppliers={formData.supplier_ids}
          onChange={(supplierIds) =>
            setFormData((prev) => ({
              ...prev,
              supplier_ids: supplierIds.slice(-1),
              distribution_method: "selected",
            }))
          }
        />
      </section>

      {/* =====================================================
          NOTES
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-2 text-2xl font-bold text-aviation-primary">
          Additional Information
        </h2>

        <p className="mb-8 text-sm text-aviation-muted">
          Add any information that will help suppliers prepare
          accurate quotations.
        </p>

        <Field label="Notes">

          <textarea
            rows={6}
            disabled={disabled}
            value={
              formData.notes
            }
            onChange={(e) =>
              updateField(
                "notes",
                e.target.value
              )
            }
            placeholder="Include any additional requirements, shipping instructions, technical details or other information..."
            className={inputClass}
          />

        </Field>

      </section>

      {/* =====================================================
          ATTACHMENTS
      ====================================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-2 text-2xl font-bold text-aviation-primary">
          Attachments
        </h2>

        <p className="mb-6 text-sm text-aviation-muted">
          Attach specifications, photographs, technical documents
          or other supporting files.
        </p>

        <input
          type="file"
          multiple
          disabled={disabled}
          onChange={handleFileSelection}
          className="block w-full rounded-xl border border-aviation-border p-3 text-sm"
        />

        {selectedFiles.length > 0 && (

          <div className="mt-6 space-y-3">

            {selectedFiles.map(
              (file, index) => (

                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center justify-between rounded-xl border bg-aviation-light p-4"
                >

                  <div className="min-w-0">

                    <p className="truncate font-medium">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-aviation-muted">
                      {(
                        file.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </p>

                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      removeFile(index)
                    }
                    className="ml-4 text-sm font-medium text-aviation-error hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>

                </div>

              )
            )}

          </div>

        )}

      </section>

      {/* =====================================================
          ACTIONS
      ====================================================== */}

      <div className="flex flex-col-reverse gap-4 pb-6 sm:flex-row sm:justify-end">

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            router.push(
              "/buyer/rfqs"
            )
          }
          className="rounded-xl border border-aviation-border px-8 py-3 font-semibold text-aviation-dark transition hover:bg-aviation-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={disabled}
          className="rounded-xl bg-aviation-primary px-8 py-3 font-semibold text-white transition hover:bg-aviation-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading
            ? "Uploading Attachments..."
            : loading
            ? "Creating RFQ..."
            : "Create RFQ"}
        </button>

      </div>

    </form>
  );
}

/* ==========================================================
   FORM FIELD
========================================================== */

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>

      <label className="mb-2 block font-medium text-aviation-dark">

        {label}

        {required && (
          <span className="ml-1 text-aviation-error">
            *
          </span>
        )}

      </label>

      {children}

    </div>
  );
}

/* ==========================================================
   INPUT STYLE
========================================================== */

const inputClass =
  "w-full rounded-xl border border-aviation-border bg-white p-3 text-aviation-dark outline-none transition placeholder:text-aviation-muted focus:border-aviation-border focus:ring-2 focus:ring-aviation-primary disabled:cursor-not-allowed disabled:bg-aviation-light";