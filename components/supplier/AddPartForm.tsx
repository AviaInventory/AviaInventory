"use client";

import { cloneElement, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import type { ElementType, ReactElement, ReactNode } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, FileText, Info, Plane, Save, ShieldCheck, Tag, Warehouse, X, AlertTriangle } from "lucide-react";

import { createPart, updatePart, getSupplierListingCertificationDocuments, getSupplierListingImages, getSupplierListingDocuments, transitionListingStatus, LISTING_CERTIFICATION_TYPES } from "@/lib/parts";
import { getCurrentSupplierBuyerSummary } from "@/lib/suppliers";
import { supabase } from "@/lib/supabase";
import BuyerListingPreview from "./BuyerListingPreview";
import ListingCertificationDocuments from "./ListingCertificationDocuments";
import type { CertificationDocumentDraft, ListingDocumentAsset, ListingImageAsset, PartFormData } from "./types";
import ListingAssetManager from "./ListingAssetManager";

interface AddPartFormProps {
  initialData?: PartFormData;
  mode?: "create" | "edit";
  partId?: string;
}

type StepId =
  | "identification"
  | "classification"
  | "condition"
  | "commercial"
  | "certification"
  | "photos"
  | "review";

const STEPS: { id: StepId; label: string; short: string }[] = [
  { id: "identification", label: "Part Identification", short: "Identify" },
  { id: "classification", label: "Classification & Compatibility", short: "Classify" },
  { id: "condition", label: "Condition & Traceability", short: "Condition" },
  { id: "commercial", label: "Inventory & Commercial", short: "Commercial" },
  { id: "certification", label: "Certification & Documentation", short: "Documents" },
  { id: "photos", label: "Photos", short: "Photos" },
  { id: "review", label: "Review & Publish", short: "Review" },
];

const CATEGORIES = [
  "Airframes",
  "Engines",
  "Avionics",
  "Components",
  "Landing Gear",
  "Consumables",
  "Electrical",
  "Safety Equipment",
  "Tools",
  "Other",
];

const CONDITIONS = ["New", "Serviceable", "Overhauled", "As Removed", "Repairable"];


const emptyForm: PartFormData = {
  partNumber: "",
  alternatePartNumber: "",
  description: "",
  manufacturer: "",
  serialNumber: "",
  aircraftManufacturer: "",
  aircraftModel: "",
  engineManufacturer: "",
  engineModel: "",
  ataChapter: "",
  category: "",
  condition: "New",
  quantity: 1,
  unitPrice: null,
  currency: "USD",
  priceType: "fixed",
  priceBasis: "unit",
  lotSize: null,
  minimumOrderQuantity: 1,
  stockLocation: "",
  availability: "In stock",
  leadTime: "",
  incoterms: "",
  paymentTerms: "",
  priceValidUntil: "",
  traceCertificate: "",
  tsn: "",
  tso: "",
  maintenanceNotes: "",
  shelfLifeExpiry: "",
  hazmat: false,
  featured: false,
  status: "Draft",
  images: [],
  documents: [],
  certificationDocuments: [],
};

function Field({
  label,
  required = false,
  recommended = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  recommended?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  const id = `listing-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const isLabelableControl = isValidElement(children) && typeof children.type === "string" && ["input", "select", "textarea"].includes(children.type);
  const control = isLabelableControl
    ? cloneElement(children as ReactElement<{ id?: string; "aria-describedby"?: string }>, { id, ...(hintId ? { "aria-describedby": hintId } : {}) })
    : children;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-aviation-dark">
          {label} {required && <span aria-hidden="true" className="text-aviation-error">*</span>}
        </label>
        {recommended && (
          <span className="rounded-full bg-aviation-warning-soft px-2 py-0.5 text-[11px] font-semibold text-aviation-warning">
            Recommended
          </span>
        )}
      </div>
      {control}
      {hint && <p id={hintId} className="mt-1.5 text-xs leading-5 text-aviation-muted">{hint}</p>}
    </div>
  );
}

const inputClass =
  "min-h-11 w-full rounded-lg border border-aviation-border bg-white px-3.5 py-2.5 text-sm text-aviation-dark outline-none transition focus:border-aviation-primary focus:ring-2 focus:ring-aviation-primary/20 disabled:cursor-not-allowed disabled:bg-aviation-light";

function SectionHeader({ icon: Icon, eyebrow, title, description }: { icon: ElementType; eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-7 border-b border-aviation-border pb-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-aviation-primary">
        <Icon size={15} aria-hidden="true" /> {eyebrow}
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-aviation-dark">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-aviation-muted">{description}</p>
    </div>
  );
}

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" }) {
  const styles = {
    neutral: "border-aviation-border bg-aviation-light text-aviation-dark",
    success: "border-aviation-success/30 bg-aviation-success-soft text-aviation-success",
    warning: "border-aviation-warning/30 bg-aviation-warning-soft text-aviation-warning",
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}

function CertificationDocumentRow({ document, index, onChange, onRemove }: {
  document: CertificationDocumentDraft; index: number; onChange: (next: CertificationDocumentDraft) => void; onRemove: () => void;
}) {
  return <div className="rounded-xl border border-aviation-border bg-white p-4">
    <div className="grid gap-4 md:grid-cols-[1fr_1.2fr_1fr_auto] md:items-end">
      <Field label={`Document ${index + 1} type`} required hint="This is the supplier's declaration of what the uploaded record is. AviaInventory review is separate.">
        <select value={document.documentType} onChange={(e) => onChange({ ...document, documentType: e.target.value })} className={inputClass}>
          {LISTING_CERTIFICATION_TYPES.filter((type) => type !== "No certification document").map((type) => <option key={type}>{type}</option>)}
        </select>
      </Field>
      <Field label="File" required>
        <label className={`${inputClass} flex min-h-11 cursor-pointer items-center truncate`}><span className="truncate">{document.file.name}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) onChange({ ...document, file }); e.currentTarget.value = ""; }} /></label>
      </Field>
      <Field label="Expiry date" hint="Leave blank when no applicable expiry date exists. Do not invent one.">
        <input type="date" value={document.expiryDate} onChange={(e) => onChange({ ...document, expiryDate: e.target.value })} className={inputClass} />
      </Field>
      <button type="button" onClick={onRemove} className="min-h-11 rounded-lg border border-aviation-border px-3 text-sm font-semibold text-aviation-muted hover:border-aviation-error hover:text-aviation-error">Remove</button>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><Badge tone="neutral">Supplier declared</Badge><Badge tone="warning">Upload ready · Pending review</Badge><span className="text-aviation-muted">Uploaded files begin as Not verified. Only AviaInventory reviewers can mark them Verified.</span></div>
  </div>;
}

function BuyerHelp({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 flex gap-3 rounded-lg border border-aviation-border bg-aviation-light p-4 text-sm leading-6 text-aviation-muted">
      <Info className="mt-0.5 shrink-0 text-aviation-primary" size={17} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

export default function AddPartForm({ initialData, mode = "create", partId }: AddPartFormProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [publishConfirmationOpen, setPublishConfirmationOpen] = useState(false);
  const [publishConfirmed, setPublishConfirmed] = useState(false);
  const [existingCertificationDocuments, setExistingCertificationDocuments] = useState<import("@/lib/parts").PartCertificationDocument[]>([]);
  const [existingImages, setExistingImages] = useState<ListingImageAsset[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<ListingDocumentAsset[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const [supplierPreview, setSupplierPreview] = useState({ name: "Supplier", verificationStatus: "Draft", rating: null as number | null, reviewCount: 0, city: null as string | null, country: null as string | null });
  const [draftOwnerId, setDraftOwnerId] = useState<string | null>(null);
  const [draftStorageReady, setDraftStorageReady] = useState(false);
  const [localDraftSavedAt, setLocalDraftSavedAt] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PartFormData>(() => ({ ...emptyForm, ...(initialData ?? {}), certificationDocuments: initialData?.certificationDocuments ?? [] }));
  const firstInvalidRef = useRef<HTMLDivElement>(null);

  const step = STEPS[stepIndex];

  useEffect(() => {
    let active = true;
    Promise.all([
      supabase.auth.getUser(),
      getCurrentSupplierBuyerSummary(),
      mode === "edit" && partId ? getSupplierListingCertificationDocuments(partId) : Promise.resolve([]),
      mode === "edit" && partId ? getSupplierListingImages(partId) : Promise.resolve([]),
      mode === "edit" && partId ? getSupplierListingDocuments(partId) : Promise.resolve([]),
    ]).then(([authResult, supplier, documents, images, supportingDocuments]) => {
      if (!active) return;
      setSupplierPreview(supplier);
      setExistingCertificationDocuments(documents);
      if (images.length) setExistingImages(images);
      else if (mode === "edit" && initialData?.existingImageUrls?.length) setExistingImages(initialData.existingImageUrls.map((url, index) => ({ id: `legacy-${index}-${url}`, storagePath: null, publicUrl: url, filename: url.split("/").pop() || "part-image", altText: `${initialData.manufacturer || "Aircraft part"} ${initialData.partNumber}`, sortOrder: index, isPrimary: index === 0 })));
      setExistingDocuments(supportingDocuments);
      const userId = authResult.data.user?.id ?? null;
      setDraftOwnerId(userId);
      const key = userId ? `aviainventory:listing-draft:${userId}:${partId ?? "new"}` : null;
      if (key) {
        try {
          const raw = window.localStorage.getItem(key);
          if (raw) {
            const saved = JSON.parse(raw) as { formData?: Partial<PartFormData>; stepIndex?: number; savedAt?: string };
            if (saved.formData) setFormData((current) => ({ ...current, ...saved.formData, images: [], imageDrafts: [], documents: [], documentDrafts: [], certificationDocuments: [] }));
            if (typeof saved.stepIndex === "number") setStepIndex(Math.min(Math.max(saved.stepIndex, 0), STEPS.length - 1));
            setLocalDraftSavedAt(saved.savedAt ?? null);
          }
        } catch (error) {
          console.warn("LOCAL LISTING DRAFT RESTORE FAILED", error);
        }
      }
      setDraftStorageReady(true);
    }).catch((error) => {
      console.error("LOAD LISTING REVIEW DATA ERROR:", error);
      if (active) setDraftStorageReady(true);
    });
    return () => { active = false; };
  }, [mode, partId]);

  useEffect(() => {
    if (!draftStorageReady || !draftOwnerId) return;
    const timer = window.setTimeout(() => {
      const key = `aviainventory:listing-draft:${draftOwnerId}:${partId ?? "new"}`;
      const persisted: Partial<PartFormData> = {
        ...formData,
        images: [],
        imageDrafts: [],
        documents: [],
        documentDrafts: [],
        certificationDocuments: [],
        existingImages: undefined,
        existingDocuments: undefined,
      };
      try {
        const savedAt = new Date().toISOString();
        window.localStorage.setItem(key, JSON.stringify({ formData: persisted, stepIndex, savedAt }));
        setLocalDraftSavedAt(savedAt);
      } catch (error) {
        console.warn("LOCAL LISTING DRAFT SAVE FAILED", error);
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draftStorageReady, draftOwnerId, partId, formData, stepIndex]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty || loading) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, loading]);

  function update(updater: (previous: PartFormData) => PartFormData) {
    setFormData(updater);
    setDirty(true);
  }

  const readiness = useMemo(() => {
    const checks = [
      Boolean(formData.partNumber.trim()),
      Boolean(formData.description.trim()),
      Boolean(formData.manufacturer.trim()),
      Boolean(formData.category),
      Boolean(formData.condition),
      Number(formData.quantity) > 0,
      formData.priceType === "request_quote" || (formData.unitPrice !== null && Number(formData.unitPrice) >= 0),
      Boolean(formData.currency),
      Number(formData.minimumOrderQuantity) > 0 && Number(formData.minimumOrderQuantity) <= Number(formData.quantity),
      Boolean(formData.stockLocation.trim()),
      Boolean(formData.traceCertificate),
      formData.images.length > 0 || existingImages.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [formData, existingImages.length]);

  function validateCurrentStep(): boolean {
    let message = "";
    switch (step.id) {
      case "identification":
        if (!formData.partNumber.trim()) message = "Enter the part number before continuing.";
        else if (!formData.description.trim()) message = "Add a buyer-facing part description before continuing.";
        else if (!formData.manufacturer.trim()) message = "Enter the manufacturer before continuing.";
        break;
      case "classification":
        if (!formData.category) message = "Select a marketplace category before continuing.";
        break;
      case "condition":
        if (!formData.condition) message = "Select the part condition before continuing.";
        break;
      case "commercial":
        if (!Number.isInteger(Number(formData.quantity)) || Number(formData.quantity) <= 0) message = "Quantity must be a positive whole number.";
        else if (!formData.priceType) message = "Select a pricing method.";
        else if (!formData.priceBasis) message = "Select whether the price is per unit or per lot.";
        else if (formData.priceType !== "request_quote" && (formData.unitPrice === null || !Number.isFinite(Number(formData.unitPrice)) || Number(formData.unitPrice) < 0)) message = "Enter a valid price or choose Request Quote.";
        else if (formData.priceType === "request_quote" && formData.unitPrice !== null) message = "Request Quote listings must not contain a numeric displayed price.";
        else if (formData.priceBasis === "lot" && (!formData.lotSize || !Number.isInteger(Number(formData.lotSize)) || Number(formData.lotSize) <= 0)) message = "Lot pricing requires a positive whole-number lot size.";
        else if (formData.priceBasis === "lot" && Number(formData.lotSize) > Number(formData.quantity)) message = "Lot size cannot exceed available quantity.";
        else if (!Number.isInteger(Number(formData.minimumOrderQuantity)) || Number(formData.minimumOrderQuantity) <= 0 || Number(formData.minimumOrderQuantity) > Number(formData.quantity)) message = "Minimum order quantity must be a whole number between 1 and the available quantity.";
        else if (formData.priceBasis === "lot" && (Number(formData.minimumOrderQuantity) < Number(formData.lotSize) || Number(formData.minimumOrderQuantity) % Number(formData.lotSize) !== 0)) message = "For lot pricing, minimum order quantity must be one or more complete lots.";
        else if (!formData.currency) message = "Select a currency.";
        else if (!formData.currency || !["USD","EUR","GBP","KES","AED","ZAR"].includes(formData.currency)) message = "Select a supported currency.";
        else if (!formData.availability || !["In stock","Limited stock","On request","Made to order"].includes(formData.availability)) message = "Select a supported availability option.";
        else if (!formData.stockLocation.trim()) message = "Stock location is required.";
        break;

      case "certification":
        if (!formData.traceCertificate) message = "Declare the certification/documentation status before continuing.";
        break;
      default:
        break;
    }
    if (message) {
      setValidationError(message);
      toast.error(message);
      firstInvalidRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    setValidationError(null);
    return true;
  }

  function next() {
    if (!validateCurrentStep()) return;
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStepIndex((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(action: "draft" | "publish") {
    if (action === "publish" && !publishConfirmed) {
      setPublishConfirmationOpen(true);
      return;
    }
    if (action === "publish") {
      for (let index = 0; index < STEPS.length - 1; index += 1) {
        const original = stepIndex;
        setStepIndex(index);
        const valid = validateStepById(STEPS[index].id);
        setStepIndex(original);
        if (!valid) return;
      }
    }

    setLoading(true);
    setUploadProgress({ completed: 0, total: (formData.imageDrafts?.length ?? formData.images.length) + formData.documents.length + formData.certificationDocuments.length });
    const payload = { ...formData, existingImages, status: mode === "create" ? "Draft" : formData.status };
    const result = mode === "create"
      ? await createPart(payload, (completed, total) => setUploadProgress({ completed, total }))
      : partId
        ? await updatePart(partId, payload, (completed, total) => setUploadProgress({ completed, total }))
        : { success: false as const, error: new Error("Part ID is missing.") };

    if (result.success && action === "publish" && result.id && (mode === "create" || formData.status !== "Published")) {
      const lifecycleResult = await transitionListingStatus(result.id, "Published");
      if (!lifecycleResult.success) {
        setLoading(false);
        setUploadProgress(null);
        toast.error(lifecycleResult.error instanceof Error ? lifecycleResult.error.message : "The listing details were saved, but the status could not be changed to Published.");
        return;
      }
    }

    setLoading(false);
    setUploadProgress(null);

    if (!result.success) {
      toast.error(action === "publish" ? "We could not publish this listing." : "We could not save this draft.");
      console.error(result.error);
      return;
    }

    setDirty(false);
    if (draftOwnerId) {
      try { window.localStorage.removeItem(`aviainventory:listing-draft:${draftOwnerId}:${partId ?? "new"}`); } catch { /* best effort */ }
    }
    setLocalDraftSavedAt(null);
    toast.success(action === "publish" ? "Listing published successfully." : "Draft saved successfully.");

    if (mode === "create" && action === "draft" && result.id) {
      router.push(`/supplier/inventory/${result.id}/edit`);
    } else {
      router.push("/supplier/inventory");
    }
  }

  function validateStepById(id: StepId): boolean {
    let message = "";
    if (id === "identification") {
      if (!formData.partNumber.trim()) message = "Part number is required.";
      else if (!formData.description.trim()) message = "Description is required.";
      else if (!formData.manufacturer.trim()) message = "Manufacturer is required.";
    } else if (id === "classification" && !formData.category) {
      message = "Category is required.";
    } else if (id === "condition") {
      if (!formData.condition) message = "Condition is required.";
      else if (formData.tsn && (!Number.isFinite(Number(formData.tsn)) || Number(formData.tsn) < 0)) message = "TSN must be a non-negative number.";
      else if (formData.tso && (!Number.isFinite(Number(formData.tso)) || Number(formData.tso) < 0)) message = "TSO must be a non-negative number.";
      else if (formData.shelfLifeExpiry && new Date(formData.shelfLifeExpiry + "T00:00:00") < new Date(new Date().toDateString())) message = "Shelf-life expiry cannot be in the past when publishing.";
    } else if (id === "commercial") {
      if (!Number.isFinite(Number(formData.quantity)) || Number(formData.quantity) <= 0) message = "Quantity must be greater than zero.";
      else if (!Number.isInteger(Number(formData.quantity))) message = "Quantity must be a whole number of physical units.";
      else if (!formData.priceType) message = "Select a pricing method.";
      else if (!formData.priceBasis) message = "Select whether the price is per unit or per lot.";
      else if (formData.priceType !== "request_quote" && (formData.unitPrice === null || !Number.isFinite(Number(formData.unitPrice)) || Number(formData.unitPrice) < 0)) message = "Enter a valid price or choose Request Quote.";
      else if (formData.priceType === "request_quote" && formData.unitPrice !== null) message = "Request Quote listings must not show a numeric price.";
      else if (formData.priceBasis === "lot" && (!formData.lotSize || !Number.isInteger(Number(formData.lotSize)) || Number(formData.lotSize) <= 0)) message = "Lot pricing requires a positive whole-number lot size.";
      else if (formData.priceBasis === "lot" && Number(formData.lotSize) > Number(formData.quantity)) message = "Lot size cannot exceed available quantity.";
      else if (!Number.isInteger(Number(formData.minimumOrderQuantity)) || Number(formData.minimumOrderQuantity) <= 0 || Number(formData.minimumOrderQuantity) > Number(formData.quantity)) message = "Minimum order quantity must be a whole number between 1 and the available quantity.";
      else if (formData.priceBasis === "lot" && (Number(formData.minimumOrderQuantity) < Number(formData.lotSize) || Number(formData.minimumOrderQuantity) % Number(formData.lotSize) !== 0)) message = "For lot pricing, minimum order quantity must be one or more complete lots.";
      else if (!formData.currency || !["USD","EUR","GBP","KES","AED","ZAR"].includes(formData.currency)) message = "Select a supported currency.";
      else if (!formData.availability || !["In stock","Limited stock","On request","Made to order"].includes(formData.availability)) message = "Select a supported availability option.";
      else if (formData.priceValidUntil && new Date(formData.priceValidUntil + "T00:00:00") < new Date(new Date().toDateString())) message = "Price validity date cannot be in the past.";
      else if (!formData.stockLocation.trim()) message = "Stock location is required.";
    } else if (id === "certification" && !formData.traceCertificate) {
      message = "Certification/documentation status is required.";
    } else if (id === "photos" && (formData.imageDrafts?.length ?? 0) + existingImages.length === 0) {
      message = "Add at least one listing photo before publishing.";
    }
    if (message) {
      setValidationError(message);
      toast.error(message);
    } else {
      setValidationError(null);
    }
    return !message;
  }

  function renderStep() {
    switch (step.id) {
      case "identification":
        return (
          <section ref={firstInvalidRef} className="rounded-xl border border-aviation-border bg-white p-5 shadow-sm sm:p-7">
            <SectionHeader icon={Tag} eyebrow="Step 01" title="Identify the part" description="Start with the information buyers use to find the correct component. Part numbers and manufacturer data are the core identifiers." />
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Part Number" required hint="Enter the exact manufacturer or approved part number. Avoid adding condition or quantity to this field.">
                <input autoFocus value={formData.partNumber} onChange={(e) => update((p) => ({ ...p, partNumber: e.target.value }))} className={`${inputClass} font-mono tracking-wide`} placeholder="e.g. BACB30LN3K3" />
              </Field>
              <Field label="Alternate Part Number" hint="Use this when an interchangeable or superseding number is relevant.">
                <input value={formData.alternatePartNumber} onChange={(e) => update((p) => ({ ...p, alternatePartNumber: e.target.value }))} className={`${inputClass} font-mono`} placeholder="Optional alternate / superseded PN" />
              </Field>
              <Field label="Manufacturer" required>
                <input value={formData.manufacturer} onChange={(e) => update((p) => ({ ...p, manufacturer: e.target.value }))} className={inputClass} placeholder="e.g. Boeing, Honeywell, Safran" />
              </Field>
              <Field label="Serial Number" hint="For a serialized single-unit listing, enter the applicable serial number. For multiple serialized units, use the inventory workflow that your account supports.">
                <input value={formData.serialNumber} onChange={(e) => update((p) => ({ ...p, serialNumber: e.target.value }))} className={`${inputClass} font-mono`} placeholder="Optional serial number" />
              </Field>
            </div>
            <div className="mt-5">
              <Field label="Buyer-facing Description" required hint="Describe what the part is, its known condition, applicability and any important limitations. Do not state certification or history that you cannot substantiate.">
                <textarea rows={6} value={formData.description} onChange={(e) => update((p) => ({ ...p, description: e.target.value }))} className={`${inputClass} min-h-36 resize-y`} placeholder="Example: Serviceable flight-control component. FAA 8130-3 documentation available. Stored in controlled warehouse environment." />
              </Field>
            </div>
          </section>
        );

      case "classification":
        return (
          <section ref={firstInvalidRef} className="rounded-xl border border-aviation-border bg-white p-5 shadow-sm sm:p-7">
            <SectionHeader icon={Plane} eyebrow="Step 02" title="Classify & define compatibility" description="Structured classification helps buyers find your part without relying only on free-text search." />
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Category" required>
                <select value={formData.category} onChange={(e) => update((p) => ({ ...p, category: e.target.value }))} className={inputClass}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </select>
              </Field>
              <Field label="ATA Chapter" recommended hint="Use the ATA chapter when known. Example: 27 - Flight Controls.">
                <input value={formData.ataChapter} onChange={(e) => update((p) => ({ ...p, ataChapter: e.target.value }))} className={inputClass} placeholder="27 - Flight Controls" />
              </Field>
              <Field label="Aircraft Manufacturer" recommended>
                <select value={formData.aircraftManufacturer} onChange={(e) => update((p) => ({ ...p, aircraftManufacturer: e.target.value }))} className={inputClass}>
                  <option value="">Select manufacturer</option>
                  {['Boeing', 'Airbus', 'Embraer', 'Bombardier', 'ATR', 'Cessna', 'Beechcraft', 'Dassault', 'Gulfstream', 'Pilatus', 'Other'].map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Aircraft Model" recommended>
                <input value={formData.aircraftModel} onChange={(e) => update((p) => ({ ...p, aircraftModel: e.target.value }))} className={inputClass} placeholder="e.g. B737-800" />
              </Field>
              <Field label="Engine Manufacturer" recommended>
                <select value={formData.engineManufacturer} onChange={(e) => update((p) => ({ ...p, engineManufacturer: e.target.value }))} className={inputClass}>
                  <option value="">Select manufacturer</option>
                  {['GE Aerospace', 'Pratt & Whitney', 'Rolls-Royce', 'Safran', 'Honeywell', 'Other'].map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Engine Model" recommended>
                <input value={formData.engineModel} onChange={(e) => update((p) => ({ ...p, engineModel: e.target.value }))} className={inputClass} placeholder="e.g. CFM56-7B" />
              </Field>
            </div>
            <div className="mt-5 flex gap-3 rounded-lg border border-aviation-border bg-aviation-light p-4 text-sm text-aviation-muted">
              <Info className="mt-0.5 shrink-0 text-aviation-primary" size={17} aria-hidden="true" />
              <p>Compatibility is supplier-provided information. AviaInventory should not represent compatibility as independently verified unless a separate verification process has been completed.</p>
            </div>
          </section>
        );

      case "condition":
        return (
          <section ref={firstInvalidRef} className="rounded-xl border border-aviation-border bg-white p-5 shadow-sm sm:p-7">
            <SectionHeader icon={ShieldCheck} eyebrow="Step 03" title="Condition & traceability" description="Give buyers enough context to understand the physical and maintenance status of the item." />
            <Field label="Condition" required hint="Choose the condition that accurately describes the item being offered.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {CONDITIONS.map((condition) => (
                  <button type="button" key={condition} onClick={() => update((p) => ({ ...p, condition }))} className={`min-h-12 rounded-lg border px-3 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-aviation-primary/30 ${formData.condition === condition ? 'border-aviation-primary bg-aviation-light text-aviation-primary' : 'border-aviation-border bg-white text-aviation-dark hover:border-aviation-primary/50'}`} aria-pressed={formData.condition === condition}>{condition}</button>
                ))}
              </div>
            </Field>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Time Since New (TSN)" recommended hint="Enter the value only when applicable and known.">
                <input type="number" min="0" value={formData.tsn} onChange={(e) => update((p) => ({ ...p, tsn: e.target.value }))} className={inputClass} placeholder="Hours" />
              </Field>
              <Field label="Time Since Overhaul (TSO)" recommended>
                <input type="number" min="0" value={formData.tso} onChange={(e) => update((p) => ({ ...p, tso: e.target.value }))} className={inputClass} placeholder="Hours" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Maintenance / Traceability Notes" recommended hint="Include known maintenance history, removal context or limitations. Do not invent records.">
                  <textarea rows={5} value={formData.maintenanceNotes} onChange={(e) => update((p) => ({ ...p, maintenanceNotes: e.target.value }))} className={`${inputClass} resize-y`} placeholder="Add factual maintenance, removal or traceability information..." />
                </Field>
              </div>
              <Field label="Shelf-life Expiry" recommended hint="Use for shelf-life-controlled items where a known expiry applies.">
                <input type="date" value={formData.shelfLifeExpiry} onChange={(e) => update((p) => ({ ...p, shelfLifeExpiry: e.target.value }))} className={inputClass} />
              </Field>
            </div>
          </section>
        );

      case "commercial":
        return (
          <section ref={firstInvalidRef} className="rounded-xl border border-aviation-border bg-white p-5 shadow-sm sm:p-7">
            <SectionHeader icon={Warehouse} eyebrow="Step 04" title="Inventory & commercial terms" description="Start with the commercial facts buyers need to compare. Advanced terms stay collapsed until you need them." />
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Quantity Available" required hint="Physical units currently offered. Use a whole number."><input type="number" min={1} step={1} value={formData.quantity} onChange={(e) => update((p) => ({ ...p, quantity: e.target.value === "" ? 0 : Number(e.target.value) }))} className={`${inputClass} font-mono`} /></Field>
              <Field label="Minimum Order Quantity" required hint="Smallest number of physical units a buyer may order."><input type="number" min={1} step={1} max={formData.quantity || undefined} value={formData.minimumOrderQuantity} onChange={(e) => update((p) => ({ ...p, minimumOrderQuantity: e.target.value === "" ? 0 : Number(e.target.value) }))} className={`${inputClass} font-mono`} /></Field>
              <Field label="Pricing Method" required hint="Request Quote means no numeric price is published."><select value={formData.priceType} onChange={(e) => update((p) => ({ ...p, priceType: e.target.value as PartFormData["priceType"], unitPrice: e.target.value === "request_quote" ? null : p.unitPrice }))} className={inputClass}><option value="fixed">Fixed price</option><option value="negotiable">Negotiable price</option><option value="request_quote">Request quote</option></select></Field>
              <Field label="Price Basis" required><select value={formData.priceBasis} onChange={(e) => update((p) => ({ ...p, priceBasis: e.target.value as PartFormData["priceBasis"], lotSize: e.target.value === "unit" ? null : (p.lotSize ?? 1) }))} className={inputClass}><option value="unit">Per unit</option><option value="lot">Per lot</option></select></Field>
              {formData.priceType !== "request_quote" ? <Field label={formData.priceBasis === "lot" ? "Lot Price" : "Price"} required hint={formData.priceType === "negotiable" ? "Indicative amount; final price is negotiated." : `Published ${formData.priceBasis} amount.`}><input type="number" min={0} step="0.01" value={formData.unitPrice ?? ""} onChange={(e) => update((p) => ({ ...p, unitPrice: e.target.value === "" ? null : Number(e.target.value) }))} className={`${inputClass} font-mono`} placeholder="0.00" /></Field> : <div className="rounded-xl border border-aviation-border bg-aviation-light p-4 text-sm text-aviation-muted"><p className="font-semibold text-aviation-dark">Request a Quote</p><p className="mt-1">No numeric price will be displayed. Buyers will be asked to request a quotation.</p></div>}
              {formData.priceBasis === "lot" && <Field label="Units per Lot" required hint="Number of physical units represented by the lot price."><input type="number" min={1} step={1} value={formData.lotSize ?? ""} onChange={(e) => update((p) => ({ ...p, lotSize: e.target.value === "" ? null : Number(e.target.value) }))} className={`${inputClass} font-mono`} /></Field>}
              <Field label="Currency" required><select value={formData.currency} onChange={(e) => update((p) => ({ ...p, currency: e.target.value }))} className={inputClass}>{["USD","EUR","GBP","KES","AED","ZAR"].map((currency) => <option key={currency}>{currency}</option>)}</select></Field>
              <Field label="Availability" required><select value={formData.availability} onChange={(e) => update((p) => ({ ...p, availability: e.target.value }))} className={inputClass}><option>In stock</option><option>Limited stock</option><option>On request</option><option>Made to order</option></select></Field>
              <Field label="Stock Location" required hint="City/country or named warehouse location."><input value={formData.stockLocation} onChange={(e) => update((p) => ({ ...p, stockLocation: e.target.value }))} className={inputClass} placeholder="e.g. Nairobi, Kenya" /></Field>
              <Field label="Lead Time" recommended hint="Example: Available immediately or 3–5 business days."><input value={formData.leadTime} onChange={(e) => update((p) => ({ ...p, leadTime: e.target.value }))} className={inputClass} placeholder="Available immediately" /></Field>
            </div>
            <details className="mt-6 rounded-xl border border-aviation-border bg-aviation-light p-4">
              <summary className="cursor-pointer rounded-lg text-sm font-bold text-aviation-dark focus:outline-none focus:ring-2 focus:ring-aviation-primary/30">Advanced commercial terms <span className="ml-2 font-normal text-aviation-muted">Optional</span></summary>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field label="Incoterms" hint="Use an Incoterms 2020 term plus named place where relevant."><input value={formData.incoterms} onChange={(e) => update((p) => ({ ...p, incoterms: e.target.value }))} className={inputClass} placeholder="e.g. FCA Nairobi, Kenya" /></Field>
                <Field label="Payment Terms"><input value={formData.paymentTerms} onChange={(e) => update((p) => ({ ...p, paymentTerms: e.target.value }))} className={inputClass} placeholder="e.g. Net 30" /></Field>
                <Field label="Price Valid Until" hint="Optional for fixed or negotiable pricing. The date is validated at save/publish time."><input type="date" min={new Date().toISOString().slice(0, 10)} value={formData.priceValidUntil} onChange={(e) => update((p) => ({ ...p, priceValidUntil: e.target.value }))} className={inputClass} /></Field>
              </div>
            </details>
            <label className="mt-6 flex min-h-14 cursor-pointer items-start gap-3 rounded-lg border border-aviation-border p-4 focus-within:ring-2 focus-within:ring-aviation-primary/20"><input type="checkbox" checked={formData.hazmat} onChange={(e) => update((p) => ({ ...p, hazmat: e.target.checked }))} className="mt-1 h-5 w-5 accent-[var(--aviation-primary)]" /><span><span className="block text-sm font-semibold text-aviation-dark">Hazardous material</span><span className="mt-1 block text-xs text-aviation-muted">Mark the item when hazardous-material handling or shipping requirements apply.</span></span></label>
          </section>
        );

      case "certification":
        return (
          <section ref={firstInvalidRef} className="rounded-xl border border-aviation-border bg-white p-5 shadow-sm sm:p-7">
            <SectionHeader icon={FileText} eyebrow="Step 05" title="Certification & documentation" description="Keep four things separate: what the supplier declares, whether a file uploaded successfully, whether AviaInventory reviewed it, and whether AviaInventory verified it." />
            <div className="rounded-xl border border-aviation-warning/25 bg-aviation-warning-soft p-4">
              <div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-aviation-warning" size={19}/><div><p className="text-sm font-bold text-aviation-dark">Compliance warning</p><p className="mt-1 text-xs leading-5 text-aviation-muted">Selecting a certification type is a supplier declaration. Uploading a document proves only that a file was submitted. It does not mean the document is authentic, applicable, current or verified. Never self-label a listing document as Verified.</p></div></div>
            </div>
            <div className="mt-6"><Field label="Certification / document declaration" required hint="Choose the documentation state you can support for this listing. This is separate from AviaInventory's verification decision."><select value={formData.traceCertificate} onChange={(e) => update((p) => ({ ...p, traceCertificate: e.target.value }))} className={inputClass}><option value="">Select a documentation status</option>{LISTING_CERTIFICATION_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field></div>
            {formData.traceCertificate === "No certification document" ? (
              <div className="mt-5 rounded-xl border border-aviation-warning/25 bg-aviation-warning-soft p-4 text-sm leading-6 text-aviation-muted"><p className="font-bold text-aviation-dark">No certification document declared</p><p className="mt-1">This is the supplier's declaration that no certification document is being presented with the listing. It is not an AviaInventory finding about airworthiness, authenticity, conformity or suitability.</p><p className="mt-2 font-semibold text-aviation-dark">Do not describe the listing as certified or verified unless AviaInventory has separately verified a specific document.</p></div>
            ) : (
              <div className="mt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="text-base font-bold text-aviation-dark">Listing certification documents</h3><p className="mt-1 text-sm text-aviation-muted">Attach one or more relevant files. Each document is tracked independently at listing level.</p></div>
                  <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-aviation-primary px-4 py-2.5 text-sm font-semibold text-aviation-primary hover:bg-aviation-light"><FileText size={16}/> Add document<input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="sr-only" onChange={(e) => { const files = Array.from(e.target.files ?? []); const valid = files.filter((file) => { const extension = file.name.split(".").pop()?.toLowerCase(); if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is larger than 10 MB.`); return false; } if (!extension || !["pdf","jpg","jpeg","png"].includes(extension)) { toast.error(`${file.name}: certification files must be PDF, JPG or PNG.`); return false; } return true; }); if (valid.length) update((p) => ({ ...p, certificationDocuments: [...p.certificationDocuments, ...valid.map((file) => ({ id: crypto.randomUUID(), documentType: p.traceCertificate && p.traceCertificate !== "No certification document" ? p.traceCertificate : "Other", file, expiryDate: "" }))] })); e.currentTarget.value = ""; }}/></label>
                </div>
                <div className="mt-4 space-y-3" aria-live="polite">{formData.certificationDocuments.length === 0 && <div className="rounded-xl border border-dashed border-aviation-border bg-aviation-light p-5 text-sm text-aviation-muted">No listing-level certification files attached yet. You can save a draft while the declaration remains recorded.</div>}{formData.certificationDocuments.map((document, index) => <CertificationDocumentRow key={document.id} document={document} index={index} onChange={(next) => update((p) => ({ ...p, certificationDocuments: p.certificationDocuments.map((item) => item.id === document.id ? next : item) }))} onRemove={() => update((p) => ({ ...p, certificationDocuments: p.certificationDocuments.filter((item) => item.id !== document.id) }))} />)}</div>
              </div>
            )}
            {mode === "edit" && partId && <ListingCertificationDocuments partId={partId} editable initialDocuments={existingCertificationDocuments} />}
            <BuyerHelp>Listing-level certification verification and supplier verification are different controls. A supplier can be Verified while a particular listing document is still Pending, Under Review, Rejected or Expired. A listing document being Verified does not change the supplier's overall verification status.</BuyerHelp>
          </section>
        );

      case "photos":
        return (
          <div ref={firstInvalidRef}>
            <ListingAssetManager partId={partId} formData={formData} setFormData={update} existingImages={existingImages} setExistingImages={setExistingImages} existingDocuments={existingDocuments} setExistingDocuments={setExistingDocuments} uploadProgress={uploadProgress} />
          </div>
        );

      case "review":
        return (
          <section ref={firstInvalidRef} className="space-y-5">
            <div className="rounded-xl bg-aviation-dark p-5 text-white shadow-sm sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">Step 07 · Review & Publish</p><h2 className="mt-2 text-2xl font-bold">See the listing as a buyer would</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">Review the marketplace presentation before publication. Supplier-provided information, uploaded documents and AviaInventory verification are intentionally shown as separate states.</p></div>
                <div className="rounded-lg border border-white/20 px-4 py-3 text-right"><div className="text-2xl font-bold font-mono">{readiness}%</div><div className="text-xs text-white/70">listing readiness</div></div>
              </div>
            </div>

            <BuyerListingPreview formData={formData} existingImages={existingImages} existingCertificationDocuments={existingCertificationDocuments} supplier={supplierPreview} />

            <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <div className="rounded-xl border border-aviation-border bg-white p-5 shadow-sm sm:p-6">
                <h3 className="font-bold text-aviation-dark">Publication state</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <ReviewState title="Supplier-provided" text="Part details, compatibility, commercial information and declarations." tone="neutral" />
                  <ReviewState title="Uploaded" text={`${formData.certificationDocuments.length + existingCertificationDocuments.filter(d => d.upload_status === "Uploaded").length} documentation file(s) available to the listing.`} tone="warning" />
                  <ReviewState title="AviaInventory-verified" text="Only reviewed documents with a Verified outcome receive a trust badge." tone="success" />
                </div>
              </div>
              <aside className="rounded-xl border border-aviation-warning/30 bg-aviation-warning-soft p-5 sm:p-6"><div className="flex gap-3"><AlertTriangle size={19} className="mt-0.5 shrink-0 text-aviation-warning"/><div><h3 className="font-bold text-aviation-dark">Before you publish</h3><p className="mt-2 text-sm leading-6 text-aviation-muted">Publishing makes this listing visible in the marketplace. Supplier declarations and uploaded files do not become AviaInventory-verified through publication.</p><p className="mt-2 text-xs leading-5 text-aviation-muted">You can save as a draft and return to edit at any time.</p></div></div></aside>
            </div>
          </section>
        );
    }
  }

  return (
    <div className="space-y-5">
      <div className="sticky top-[121px] z-20 -mx-4 lg:top-0 border-b border-aviation-border bg-aviation-light/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.12em] text-aviation-primary">Supplier workspace</p><h1 className="truncate text-xl font-bold text-aviation-dark sm:text-2xl">{mode === "edit" ? "Edit Part Listing" : "List a Part for Sale"}</h1></div>
            <button type="button" onClick={() => save("draft")} disabled={loading} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-aviation-border bg-white px-4 text-sm font-semibold text-aviation-dark transition hover:border-aviation-primary disabled:opacity-50"><Save size={17} aria-hidden="true" /> <span className="hidden sm:inline">Save Draft</span></button>
          </div>

          <nav aria-label="Listing progress" className="mt-4 overflow-x-auto pb-1">
            <ol className="flex min-w-max items-center gap-2">
              {STEPS.map((item, index) => {
                const complete = index < stepIndex;
                const active = index === stepIndex;
                return <li key={item.id} className="flex items-center gap-2">
                  <button type="button" onClick={() => index <= stepIndex && setStepIndex(index)} disabled={index > stepIndex} aria-current={active ? "step" : undefined} className={`flex min-h-10 items-center gap-2 rounded-full px-3 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-aviation-primary/30 ${active ? "bg-aviation-dark text-white" : complete ? "bg-aviation-success-soft text-aviation-success" : "bg-white text-aviation-muted"}`}>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current font-mono text-[10px]">{complete ? <Check size={12} /> : index + 1}</span><span>{item.short}</span>
                  </button>
                  {index < STEPS.length - 1 && <span className="h-px w-4 bg-aviation-border" aria-hidden="true" />}
                </li>;
              })}
            </ol>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl">
        {validationError && <div role="alert" aria-live="assertive" className="mb-4 rounded-xl border border-aviation-error/30 bg-aviation-error-soft px-4 py-3 text-sm font-medium text-aviation-error">{validationError}</div>}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-semibold text-aviation-primary">{step.label}</p><p className="mt-0.5 text-xs text-aviation-muted">Step {stepIndex + 1} of {STEPS.length}</p></div>
          <div className="flex items-center gap-2 text-xs text-aviation-muted"><span className="h-2 w-2 rounded-full bg-aviation-success" /> Required <span className="ml-2 h-2 w-2 rounded-full bg-aviation-warning" /> Recommended</div>
        </div>

        {renderStep()}

        <div className="mt-5 flex flex-col-reverse gap-3 border-t border-aviation-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={back} disabled={stepIndex === 0 || loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-aviation-border bg-white px-5 text-sm font-semibold text-aviation-dark transition hover:border-aviation-primary disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={17} aria-hidden="true" /> {stepIndex === STEPS.length - 1 ? "Back to Edit" : "Back"}</button>
          <div className="flex flex-col gap-3 sm:flex-row">
            {stepIndex === STEPS.length - 1 ? (
              <><button type="button" onClick={() => save("draft")} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-aviation-border bg-white px-5 text-sm font-semibold text-aviation-dark transition hover:border-aviation-primary disabled:opacity-50"><Save size={17} aria-hidden="true" /> {mode === "edit" ? "Save Changes" : "Save Draft"}</button>{(["Draft", "Inactive"].includes(formData.status)) && <button type="button" onClick={() => { setPublishConfirmed(false); setPublishConfirmationOpen(true); }} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-aviation-primary px-6 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Publishing…" : <><Check size={17} aria-hidden="true" /> Publish Listing</>}</button>}</>
            ) : (
              <button type="button" onClick={next} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-aviation-dark px-6 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50">Continue <ChevronRight size={17} aria-hidden="true" /></button>
            )}
          </div>
        </div>

        {dirty && <p className="text-center text-xs text-aviation-muted">Unsaved changes · your progress is also saved locally in this browser{localDraftSavedAt ? ` · saved ${new Date(localDraftSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}.</p>}
      </div>

      {publishConfirmationOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-aviation-dark/60 p-3 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="publish-confirmation-title">
          <div className="w-full max-w-lg rounded-2xl border border-aviation-border bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-aviation-primary">Final confirmation</p><h2 id="publish-confirmation-title" className="mt-2 text-xl font-bold text-aviation-dark">Publish this listing?</h2></div><button type="button" onClick={() => setPublishConfirmationOpen(false)} className="min-h-11 min-w-11 rounded-lg border border-aviation-border text-aviation-muted" aria-label="Close publication confirmation"><X size={18} className="mx-auto"/></button></div>
            <p className="mt-4 text-sm leading-6 text-aviation-muted">You are about to make <strong className="text-aviation-dark">{formData.partNumber || "this listing"}</strong> visible to buyers. Confirm that the information shown in the buyer preview is accurate to the best of your knowledge.</p>
            <label className="mt-5 flex cursor-pointer gap-3 rounded-xl border border-aviation-border bg-aviation-light p-4"><input type="checkbox" checked={publishConfirmed} onChange={(e) => setPublishConfirmed(e.target.checked)} className="mt-1 h-4 w-4 accent-aviation-primary"/><span className="text-sm leading-6 text-aviation-dark">I have reviewed the buyer-facing preview and explicitly confirm that I want to publish this listing.</span></label>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPublishConfirmationOpen(false)} className="min-h-11 rounded-lg border border-aviation-border bg-white px-5 text-sm font-semibold text-aviation-dark">Cancel</button><button type="button" disabled={!publishConfirmed || loading} onClick={() => { setPublishConfirmationOpen(false); save("publish"); }} className="min-h-11 rounded-lg bg-aviation-primary px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Confirm & Publish Listing</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewState({ title, text, tone }: { title: string; text: string; tone: "neutral" | "warning" | "success" }) {
  const styles = { neutral: "border-aviation-border bg-aviation-light", warning: "border-aviation-warning/30 bg-aviation-warning-soft", success: "border-aviation-success/30 bg-aviation-success-soft" };
  return <div className={`rounded-xl border p-4 ${styles[tone]}`}><p className="text-xs font-bold uppercase tracking-wide text-aviation-muted">{title}</p><p className="mt-2 text-sm leading-5 text-aviation-dark">{text}</p></div>;
}

function ReviewItem({ label, value, wide = false }: { label: string; value?: string; wide?: boolean }) {
  return <div className={wide ? "sm:col-span-2" : ""}><dt className="text-xs font-semibold uppercase tracking-wide text-aviation-muted">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-aviation-dark">{value || "Not provided"}</dd></div>;
}
