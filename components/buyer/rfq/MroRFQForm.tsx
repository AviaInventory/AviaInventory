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

import { FormFooter, FormPanel, FormRow, FormSection, btnPrimary, btnSecondary, fieldInput, fieldSelect, fieldTextarea } from "@/components/ui/form";
import { numberInputValue, parseNumberInput } from "@/lib/number-input";

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
    <form onSubmit={handleSubmit}>
      <FormPanel>
        <FormSection
          title="Repair / Overhaul Request"
          text="Describe the component and the work you need. Your RFQ goes to every MRO-capable supplier on AviaInventory."
        />

        <FormRow label="Component" htmlFor="mro-component" required labelWidth="200px">
          <input id="mro-component" type="text" required disabled={disabled} value={formData.component} onChange={(e) => updateField("component", e.target.value)} placeholder="e.g. Main landing gear actuator" className={fieldInput} />
        </FormRow>

        <FormRow label="Part Number" htmlFor="mro-part-number" required labelWidth="200px">
          <input id="mro-part-number" type="text" required disabled={disabled} value={formData.part_number} onChange={(e) => updateField("part_number", e.target.value)} placeholder="e.g. 065-311-200" className={fieldInput} />
        </FormRow>

        <FormRow label="Description / Brief scope of repair service needed" htmlFor="mro-description" required labelWidth="200px">
          <textarea id="mro-description" required rows={4} disabled={disabled} value={formData.description} onChange={(e) => updateField("description", e.target.value)} placeholder="e.g. Unit leaking hydraulic fluid; requires inspection, repair or overhaul with EASA Form 1 / FAA 8130-3 release." className={fieldTextarea} />
        </FormRow>

        <FormRow label="Component Manufacturer" htmlFor="mro-component-manufacturer" required labelWidth="200px">
          <input id="mro-component-manufacturer" type="text" required disabled={disabled} value={formData.component_manufacturer} onChange={(e) => updateField("component_manufacturer", e.target.value)} placeholder="e.g. Collins Aerospace" className={fieldInput} />
        </FormRow>

        <FormRow label="Aircraft Model" htmlFor="mro-aircraft-model" required labelWidth="200px">
          <input id="mro-aircraft-model" type="text" required disabled={disabled} value={formData.aircraft_model} onChange={(e) => updateField("aircraft_model", e.target.value)} placeholder="e.g. Dash 8-400" className={fieldInput} />
        </FormRow>

        <FormRow label="Quantity" htmlFor="mro-quantity" required labelWidth="200px">
          <input id="mro-quantity" type="number" min="1" required disabled={disabled} value={numberInputValue(formData.quantity)} onChange={(e) => updateField("quantity", parseNumberInput(e.target.value))} className={`${fieldInput} sm:max-w-[200px]`} />
        </FormRow>

        <FormRow label="Availability of forward exchange option" htmlFor="mro-forward-exchange" required labelWidth="200px">
          <select id="mro-forward-exchange" required disabled={disabled} value={formData.forward_exchange} onChange={(e) => updateField("forward_exchange", e.target.value as MroFormData["forward_exchange"])} className={`${fieldSelect} sm:max-w-[200px]`}>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </FormRow>

        <FormRow label="Date Required" htmlFor="mro-required-date" required labelWidth="200px" hint={`At least ${RFQ_MIN_LEAD_DAYS} days from today. MROs can quote until this date.`}>
          <input id="mro-required-date" type="date" required disabled={disabled} min={minRequiredDate()} value={formData.required_date} onChange={(e) => updateField("required_date", e.target.value)} className={`${fieldInput} sm:max-w-[200px]`} />
        </FormRow>

        <FormSection
          title="Photos & Documents"
          text={`Upload photos of the component, data plates, teardown reports, work orders or other documents (up to ${MAX_FILE_MB} MB each).`}
        />

        <FormRow label="Files" optional labelWidth="200px">
          <label className={`${btnSecondary} cursor-pointer ${disabled ? "pointer-events-none opacity-50" : ""}`}>
            <Paperclip size={15} />
            Add photos or documents
            <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" disabled={disabled} onChange={handleFiles} className="sr-only" />
          </label>

          {files.length > 0 && (
            <ul className="mt-2 divide-y divide-aviation-border rounded-md border border-aviation-border">
              {files.map((file, index) => (
                <li key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-3 px-2.5 py-1.5">
                  <span className="min-w-0 text-[13px]">
                    <span className="block truncate font-medium text-aviation-dark">{file.name}</span>
                    <span className="block text-xs text-[var(--aviation-muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </span>
                  <button type="button" disabled={disabled} onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))} aria-label={`Remove ${file.name}`} className="grid h-8 w-8 shrink-0 place-items-center rounded text-aviation-error hover:bg-aviation-error-soft disabled:opacity-50 sm:h-7 sm:w-7">
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </FormRow>

        <FormFooter>
          <button type="button" disabled={disabled} onClick={() => router.push("/buyer/rfqs")} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" disabled={disabled} className={btnPrimary}>
            {uploading ? "Uploading files..." : loading ? "Sending RFQ..." : "Send MRO Services RFQ"}
          </button>
        </FormFooter>
      </FormPanel>
    </form>
  );
}
