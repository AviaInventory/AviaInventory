"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, X } from "lucide-react";

import {
  createRFQ,
  minRequiredDate,
  uploadRFQAttachment,
  validateRequiredDate,
  RFQ_MIN_LEAD_DAYS,
} from "@/lib/rfqs";

import { Field, inputClass } from "./RFQFormFields";

const MAX_FILE_MB = 20;

type MroFormData = {
  component: string;
  part_number: string;
  description: string;
  component_manufacturer: string;
  aircraft_model: string;
  quantity: number;
  forward_exchange: "Yes" | "No" | "";
  required_date: string;
};

/** RFQ for repair / overhaul of a component. Goes to every MRO-capable supplier. */
export default function MroRFQForm() {
  const router = useRouter();

  const [formData, setFormData] = useState<MroFormData>({
    component: "",
    part_number: "",
    description: "",
    component_manufacturer: "",
    aircraft_model: "",
    quantity: 1,
    forward_exchange: "",
    required_date: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const disabled = loading || uploading;

  function updateField<K extends keyof MroFormData>(field: K, value: MroFormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    const tooLarge = picked.find((file) => file.size > MAX_FILE_MB * 1024 * 1024);
    if (tooLarge) alert(`${tooLarge.name} is larger than ${MAX_FILE_MB} MB.`);
    setFiles((prev) => [...prev, ...picked.filter((file) => file.size <= MAX_FILE_MB * 1024 * 1024)]);
    event.target.value = "";
  }

  function validate(): string | null {
    if (!formData.component.trim()) return "Please enter the component.";
    if (!formData.part_number.trim()) return "Please enter the part number.";
    if (!formData.description.trim()) return "Please describe the repair / overhaul you need.";
    if (!formData.component_manufacturer.trim()) return "Please enter the component manufacturer.";
    if (!formData.aircraft_model.trim()) return "Please enter the aircraft model.";
    if (!Number.isFinite(Number(formData.quantity)) || Number(formData.quantity) <= 0) return "Please enter a valid quantity.";
    if (!formData.forward_exchange) return "Please say whether a forward exchange option is available.";
    return validateRequiredDate(formData.required_date);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;

    const validationError = validate();
    if (validationError) {
      alert(validationError);
      return;
    }

    setLoading(true);
    try {
      setUploading(true);
      const attachments: string[] = [];
      for (const file of files) {
        const result = await uploadRFQAttachment(file);
        if (!result.success || !result.url) throw new Error(result.error || `Failed to upload ${file.name}`);
        attachments.push(result.url);
      }
      setUploading(false);

      const result = await createRFQ({
        rfq_type: "mro",
        component: formData.component.trim(),
        part_number: formData.part_number.trim(),
        description: formData.description.trim(),
        component_manufacturer: formData.component_manufacturer.trim(),
        aircraft_model: formData.aircraft_model.trim(),
        quantity: Number(formData.quantity),
        forward_exchange: formData.forward_exchange,
        required_date: formData.required_date,
        preferred_condition: "",
        certification_required: "",
        notes: "",
        distribution_method: "broadcast",
        supplier_ids: [],
        attachments,
      });

      if (!result.success) {
        alert(typeof result.error === "string" ? result.error : "Unable to create the RFQ.");
        return;
      }

      alert("MRO service RFQ sent to MRO-capable suppliers.");
      router.push("/buyer/rfqs");
      router.refresh();
    } catch (error) {
      console.error("CREATE MRO RFQ ERROR:", error);
      alert(error instanceof Error ? error.message : "Something went wrong while creating the RFQ.");
    } finally {
      setUploading(false);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl bg-white p-8 shadow">
        <h2 className="mb-2 text-2xl font-bold text-aviation-primary">Repair / Overhaul Request</h2>
        <p className="mb-8 text-sm text-aviation-muted">
          Describe the component and the work you need. Your RFQ goes to every MRO-capable supplier on AviaInventory.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Component" required>
            <input type="text" required disabled={disabled} value={formData.component} onChange={(e) => updateField("component", e.target.value)} placeholder="e.g. Main landing gear actuator" className={inputClass} />
          </Field>

          <Field label="Part Number" required>
            <input type="text" required disabled={disabled} value={formData.part_number} onChange={(e) => updateField("part_number", e.target.value)} placeholder="e.g. 065-311-200" className={inputClass} />
          </Field>

          <div className="md:col-span-2">
            <Field label="Description / Brief scope of repair service needed" required>
              <textarea required rows={4} disabled={disabled} value={formData.description} onChange={(e) => updateField("description", e.target.value)} placeholder="e.g. Unit leaking hydraulic fluid; requires inspection, repair or overhaul with EASA Form 1 / FAA 8130-3 release." className={inputClass} />
            </Field>
          </div>

          <Field label="Component Manufacturer" required>
            <input type="text" required disabled={disabled} value={formData.component_manufacturer} onChange={(e) => updateField("component_manufacturer", e.target.value)} placeholder="e.g. Collins Aerospace" className={inputClass} />
          </Field>

          <Field label="Aircraft Model" required>
            <input type="text" required disabled={disabled} value={formData.aircraft_model} onChange={(e) => updateField("aircraft_model", e.target.value)} placeholder="e.g. Dash 8-400" className={inputClass} />
          </Field>

          <Field label="Quantity" required>
            <input type="number" min="1" required disabled={disabled} value={formData.quantity} onChange={(e) => updateField("quantity", Number(e.target.value))} className={inputClass} />
          </Field>

          <Field label="Availability of forward exchange option" required>
            <select required disabled={disabled} value={formData.forward_exchange} onChange={(e) => updateField("forward_exchange", e.target.value as MroFormData["forward_exchange"])} className={inputClass}>
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </Field>

          <Field label="Date Required" required hint={`At least ${RFQ_MIN_LEAD_DAYS} days from today. MROs can quote until this date.`}>
            <input type="date" required disabled={disabled} min={minRequiredDate()} value={formData.required_date} onChange={(e) => updateField("required_date", e.target.value)} className={inputClass} />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow">
        <h2 className="mb-2 text-2xl font-bold text-aviation-primary">Photos & Documents</h2>
        <p className="mb-6 text-sm text-aviation-muted">
          Upload photos of the component, data plates, teardown reports, work orders or other documents (up to {MAX_FILE_MB} MB each).
        </p>

        <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-aviation-border p-6 text-sm font-semibold text-aviation-primary hover:border-aviation-primary ${disabled ? "pointer-events-none opacity-50" : ""}`}>
          <Paperclip size={18} />
          Add photos or documents
          <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" disabled={disabled} onChange={handleFiles} className="sr-only" />
        </label>

        {files.length > 0 && (
          <ul className="mt-6 space-y-3">
            {files.map((file, index) => (
              <li key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-4 rounded-xl border bg-aviation-light p-4">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-aviation-dark">{file.name}</span>
                  <span className="mt-1 block text-xs text-aviation-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </span>
                <button type="button" disabled={disabled} onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))} aria-label={`Remove ${file.name}`} className="rounded-lg p-2 text-aviation-error hover:bg-aviation-error-soft disabled:opacity-50">
                  <X size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-col-reverse gap-4 pb-6 sm:flex-row sm:justify-end">
        <button type="button" disabled={disabled} onClick={() => router.push("/buyer/rfqs")} className="rounded-xl border border-aviation-border px-8 py-3 font-semibold text-aviation-dark transition hover:bg-aviation-light disabled:cursor-not-allowed disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={disabled} className="rounded-xl bg-aviation-primary px-8 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50">
          {uploading ? "Uploading files..." : loading ? "Sending RFQ..." : "Send MRO Services RFQ"}
        </button>
      </div>
    </form>
  );
}
