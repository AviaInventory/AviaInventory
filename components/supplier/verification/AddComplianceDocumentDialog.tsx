"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Lock, UploadCloud, X } from "lucide-react";
import RequiredMark from "@/components/ui/RequiredMark";
import { FieldGroup, FormRow, btnPrimary, btnSecondary, fieldError, fieldInput, fieldInputError, fieldLabel, fieldSelect } from "@/components/ui/form";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "doc", "docx", "xls", "xlsx"];

/** What each document type is, so suppliers know what to upload and we can pre-fill sensible values. */
export const DOCUMENT_TYPES = [
  {
    type: "Certificate of Incorporation / Business Registration",
    hint: "Your company's certificate of incorporation or business registration.",
    name: "Certificate of Incorporation",
    authority: "Business Registration Service (Kenya)",
    usuallyExpires: false,
  },
  {
    type: "Air Operator / Maintenance Approval",
    hint: "Air Operator Certificate (AOC) or approved maintenance organisation approval.",
    name: "KCAA Approval Certificate",
    authority: "KCAA",
    usuallyExpires: true,
  },
  {
    type: "Repair Station / AMO Certificate",
    hint: "Part-145 / repair station / AMO certificate.",
    name: "Part-145 Approval",
    authority: "KCAA, EASA or FAA",
    usuallyExpires: true,
  },
  {
    type: "Quality Management Certificate",
    hint: "ISO 9001, AS9100, AS9110 or AS9120 certificate.",
    name: "AS9120 Certificate",
    authority: "Certification body (e.g. Bureau Veritas)",
    usuallyExpires: true,
  },
  {
    type: "EASA Form 1 / Approval",
    hint: "A sample EASA Form 1 or your EASA approval.",
    name: "EASA Form 1",
    authority: "EASA",
    usuallyExpires: false,
  },
  {
    type: "FAA 8130-3 / Authorized Release",
    hint: "A sample FAA 8130-3 tag or authorised release certificate.",
    name: "FAA 8130-3",
    authority: "FAA",
    usuallyExpires: false,
  },
  {
    type: "Insurance Certificate",
    hint: "Product or aviation liability insurance certificate.",
    name: "Liability Insurance Certificate",
    authority: "Insurer",
    usuallyExpires: true,
  },
  {
    type: "Bank / Tax Registration",
    hint: "KRA PIN certificate or a bank confirmation letter.",
    name: "KRA PIN Certificate",
    authority: "Kenya Revenue Authority",
    usuallyExpires: false,
  },
  {
    type: "Other Compliance Document",
    hint: "Any other approval or compliance evidence.",
    name: "",
    authority: "",
    usuallyExpires: false,
  },
] as const;

export type NewComplianceDocument = {
  document_type: string;
  document_name: string;
  issue_date: string;
  expiry_date: string;
  issuing_authority: string;
  file: File;
};

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileProblem(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ACCEPTED_EXTENSIONS.includes(ext)) return "Use a PDF, image (PNG/JPG), Word or Excel file.";
  if (file.size > MAX_DOCUMENT_BYTES) return `This file is ${formatBytes(file.size)}. The limit is 10 MB.`;
  return null;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function AddComplianceDocumentDialog({
  busy,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  onClose: () => void;
  onSubmit: (doc: NewComplianceDocument) => void;
}) {
  const [type, setType] = useState<string>(DOCUMENT_TYPES[0].type);
  const [name, setName] = useState<string>(DOCUMENT_TYPES[0].name);
  const [nameEdited, setNameEdited] = useState(false);
  const [authority, setAuthority] = useState<string>(DOCUMENT_TYPES[0].authority);
  const [authorityEdited, setAuthorityEdited] = useState(false);
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const firstField = useRef<HTMLSelectElement>(null);

  const meta = DOCUMENT_TYPES.find((item) => item.type === type) ?? DOCUMENT_TYPES[0];

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  function changeType(next: string) {
    setType(next);
    const nextMeta = DOCUMENT_TYPES.find((item) => item.type === next);
    // Only replace suggestions the supplier hasn't typed over.
    if (!nameEdited) setName(nextMeta?.name ?? "");
    if (!authorityEdited) setAuthority(nextMeta?.authority ?? "");
  }

  function chooseFile(selected: File | undefined | null) {
    if (!selected) return;
    const problem = fileProblem(selected);
    setFileError(problem ?? "");
    setFile(problem ? null : selected);
  }

  const errors = {
    name: !name.trim() ? "Give the document a name." : "",
    file: fileError || (!file ? "Choose the file to upload." : ""),
    issueDate: issueDate && issueDate > today() ? "The issue date can't be in the future." : "",
    expiryDate: expiryDate && issueDate && expiryDate <= issueDate ? "The expiry date must be after the issue date." : "",
  };
  const valid = !Object.values(errors).some(Boolean);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (!valid || !file) return;
    onSubmit({ document_type: type, document_name: name.trim(), issue_date: issueDate, expiry_date: expiryDate, issuing_authority: authority.trim(), file });
  }

  const show = (message: string, always = false) => (message && (attempted || always) ? message : "");

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-aviation-dark/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <form
        onSubmit={submit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-document-title"
        className="compact-form max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-aviation-border px-5 py-4 sm:px-7">
          <div>
            <h3 id="add-document-title" className="text-xl font-bold text-aviation-dark">
              Add compliance document
            </h3>
            <p className="mt-1 text-sm text-[var(--aviation-muted)]">AviaInventory reviews each document before your company can be verified.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-lg p-2 text-[var(--aviation-muted)] hover:bg-aviation-light hover:text-aviation-dark disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-7">
          <FormRow label="Document type" htmlFor="doc-type" required hint={meta.hint}>
            <select id="doc-type" ref={firstField} value={type} onChange={(event) => changeType(event.target.value)} className={fieldSelect}>
              {DOCUMENT_TYPES.map((item) => (
                <option key={item.type} value={item.type}>
                  {item.type}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow label="File" required error={show(errors.file, Boolean(fileError)) ? errors.file : undefined}>
            {file ? (
              <div className="flex items-center gap-3 rounded-md border border-aviation-primary/40 bg-aviation-success-soft px-3 py-2">
                <FileText size={18} className="shrink-0 text-aviation-primary" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-aviation-dark">{file.name}</p>
                  <p className="text-xs text-[var(--aviation-muted)]">{formatBytes(file.size)}</p>
                </div>
                <button type="button" onClick={() => setFile(null)} disabled={busy} className="rounded-md px-2 py-1 text-[13px] font-semibold text-aviation-primary hover:underline">
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  chooseFile(event.dataTransfer.files?.[0]);
                }}
                className={`flex w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed px-3 py-4 text-center transition ${
                  dragging ? "border-aviation-primary bg-aviation-success-soft" : show(errors.file, Boolean(fileError)) ? "border-red-400 bg-red-50/40" : "border-aviation-border bg-aviation-light hover:border-aviation-primary"
                }`}
              >
                <UploadCloud size={20} className="text-aviation-primary" aria-hidden="true" />
                <span className="text-[13px] font-semibold text-aviation-dark">Drag a file here or click to browse</span>
                <span className="text-xs text-[var(--aviation-muted)]">PDF, PNG, JPG, Word or Excel · up to 10 MB</span>
              </button>
            )}
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPTED_EXTENSIONS.map((ext) => `.${ext}`).join(",")}
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                chooseFile(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </FormRow>

          <FieldGroup>
            <div>
              <label htmlFor="doc-name" className={fieldLabel}>
                Document name <RequiredMark />
              </label>
              <input
                id="doc-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameEdited(true);
                }}
                placeholder="e.g. EASA Part-145 Approval"
                className={show(errors.name) ? fieldInputError : fieldInput}
              />
              {show(errors.name) && <p className={fieldError}>{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="doc-authority" className={fieldLabel}>
                Issuing authority
              </label>
              <input
                id="doc-authority"
                value={authority}
                onChange={(event) => {
                  setAuthority(event.target.value);
                  setAuthorityEdited(true);
                }}
                placeholder="e.g. KCAA, EASA, FAA"
                className={fieldInput}
              />
            </div>
            <div>
              <label htmlFor="doc-issued" className={fieldLabel}>
                Issue date
              </label>
              <input
                id="doc-issued"
                type="date"
                max={today()}
                value={issueDate}
                onChange={(event) => setIssueDate(event.target.value)}
                className={errors.issueDate ? fieldInputError : fieldInput}
              />
              {errors.issueDate && <p className={fieldError}>{errors.issueDate}</p>}
            </div>
            <div>
              <label htmlFor="doc-expiry" className={fieldLabel}>
                Expiry date{" "}
                <span className="font-normal text-[var(--aviation-muted)]">{meta.usuallyExpires ? "(this document usually expires)" : "(if it has one)"}</span>
              </label>
              <input
                id="doc-expiry"
                type="date"
                min={issueDate || undefined}
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                className={errors.expiryDate ? fieldInputError : fieldInput}
              />
              {errors.expiryDate && <p className={fieldError}>{errors.expiryDate}</p>}
            </div>
          </FieldGroup>

          <p className="flex items-start gap-2 rounded-md bg-aviation-light px-3 py-2 text-xs leading-5 text-[var(--aviation-muted)]">
            <Lock size={14} className="mt-0.5 shrink-0 text-aviation-primary" aria-hidden="true" />
            Stored privately. Only you and AviaInventory reviewers can open it; buyers only see your verification status. Documents close to expiry are flagged on this page.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-aviation-border px-5 py-3 sm:flex-row sm:justify-end sm:px-7">
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || (attempted && !valid)}
            className={btnPrimary}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            {busy ? "Uploading…" : "Upload document"}
          </button>
        </div>
      </form>
    </div>
  );
}
