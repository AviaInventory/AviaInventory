"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { btnPrimary, fieldCheckbox, fieldHint, fieldLabel, fieldTextarea } from "@/components/ui/form";

const DECISIONS = [
  { status: "Under Review", hint: "You are reviewing this supplier now." },
  { status: "More Information Required", hint: "The supplier must provide or fix something. List it below." },
  { status: "Verified", hint: "Buyers will see this supplier as Verified. Requires at least one verified document." },
  { status: "Rejected", hint: "The supplier is not approved. A comment is required." },
  { status: "Suspended", hint: "A previously verified supplier is suspended. A comment is required." },
] as const;

/** Final verification decision for a supplier in the platform console. */
export default function SupplierVerificationDecision({
  supplierId,
  currentStatus,
  currentComments,
  currentMissing,
  suggestedMissing,
}: {
  supplierId: string;
  currentStatus: string;
  currentComments: string | null;
  currentMissing: string[];
  /** Outstanding checklist items, offered as a starting point for "More Information Required". */
  suggestedMissing: string[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(currentStatus === "Submitted" ? "Under Review" : currentStatus);
  const [comments, setComments] = useState(currentComments ?? "");
  const [missing, setMissing] = useState((currentMissing.length ? currentMissing : suggestedMissing).join("\n"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/supplier-verifications/${supplierId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status,
          comments,
          missingInformation: status === "More Information Required" ? missing.split("\n") : [],
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Unable to save the decision.");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save the decision.");
    } finally {
      setSaving(false);
    }
  }

  const hint = DECISIONS.find((decision) => decision.status === status)?.hint;

  return (
    <form onSubmit={save} className="compact-form space-y-3.5">
      <fieldset>
        <legend className="text-[13px] font-semibold text-aviation-dark">Decision</legend>
        <div className="mt-1 grid grid-cols-1 gap-x-4 gap-y-1 min-[420px]:grid-cols-2">
          {DECISIONS.map((decision) => (
            <label
              key={decision.status}
              className={`flex cursor-pointer items-center gap-2 py-0.5 text-[13px] ${
                status === decision.status ? "font-semibold text-aviation-primary" : "text-aviation-dark"
              }`}
            >
              <input type="radio" name="decision" value={decision.status} checked={status === decision.status} onChange={() => setStatus(decision.status)} className={fieldCheckbox} />
              {decision.status}
            </label>
          ))}
        </div>
        {hint && <p className={fieldHint}>{hint}</p>}
      </fieldset>

      {status === "More Information Required" && (
        <div>
          <label htmlFor="missing" className={fieldLabel}>
            What the supplier must provide <span className="font-normal text-[var(--aviation-muted)]">(one per line)</span>
          </label>
          <textarea id="missing" rows={4} value={missing} onChange={(event) => setMissing(event.target.value)} className={fieldTextarea} />
        </div>
      )}

      <div>
        <label htmlFor="comments" className={fieldLabel}>
          Comments for the supplier
        </label>
        <textarea
          id="comments"
          rows={3}
          value={comments}
          onChange={(event) => setComments(event.target.value)}
          placeholder="Shown in the supplier's Verification Center."
          className={fieldTextarea}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-aviation-error-soft px-3 py-2 text-[13px] text-aviation-error">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="rounded-md bg-aviation-success-soft px-3 py-2 text-[13px] text-aviation-primary">
          Decision saved. The supplier sees it in their Verification Center.
        </p>
      )}

      <div className="flex justify-end border-t border-aviation-border pt-4">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving && <Loader2 size={15} className="animate-spin" />}
          Save decision
        </button>
      </div>
    </form>
  );
}
