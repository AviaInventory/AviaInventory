"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";

const DECISIONS = [
  { status: "Verified", label: "Verify", className: "bg-aviation-success text-white" },
  { status: "Under Review", label: "Under review", className: "border border-aviation-border bg-white text-aviation-dark" },
  { status: "Rejected", label: "Reject", className: "border border-aviation-error/40 bg-white text-aviation-error" },
  { status: "Expired", label: "Expired", className: "border border-aviation-border bg-white text-aviation-dark" },
] as const;

/** Decision controls for one supplier verification document in the platform console. */
export default function SupplierDocumentReview({
  documentId,
  currentStatus,
  currentNotes,
}: {
  documentId: string;
  currentStatus: string;
  currentNotes: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function decide(status: string) {
    setError("");
    setSaving(status);
    try {
      const response = await fetch(`/api/admin/supplier-verifications/documents/${documentId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Unable to save the decision.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save the decision.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <a
        href={`/api/admin/supplier-verifications/documents/${documentId}/file`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-aviation-primary hover:underline"
      >
        <ExternalLink size={15} aria-hidden="true" /> Open document
      </a>

      <label className="block text-xs font-semibold text-aviation-dark" htmlFor={`notes-${documentId}`}>
        Notes for the supplier <span className="font-normal text-[var(--aviation-muted)]">(required to reject)</span>
      </label>
      <textarea
        id={`notes-${documentId}`}
        rows={2}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="e.g. Certificate is illegible; please upload a clearer scan."
        className="w-full rounded-xl border border-aviation-border px-3 py-2 text-sm"
      />

      <div className="flex flex-wrap gap-2">
        {DECISIONS.map((decision) => (
          <button
            key={decision.status}
            type="button"
            onClick={() => decide(decision.status)}
            disabled={saving !== null || decision.status === currentStatus}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${decision.className}`}
          >
            {saving === decision.status && <Loader2 size={14} className="animate-spin" />}
            {decision.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-aviation-error-soft px-3 py-2 text-sm text-aviation-error">
          {error}
        </p>
      )}
    </div>
  );
}
