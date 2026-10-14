"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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
    <form onSubmit={save} className="space-y-4">
      <fieldset>
        <legend className="text-sm font-semibold text-aviation-dark">Decision</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {DECISIONS.map((decision) => (
            <label
              key={decision.status}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                status === decision.status ? "border-aviation-primary bg-aviation-success-soft text-aviation-primary" : "border-aviation-border bg-white"
              }`}
            >
              <input type="radio" name="decision" value={decision.status} checked={status === decision.status} onChange={() => setStatus(decision.status)} />
              {decision.status}
            </label>
          ))}
        </div>
        {hint && <p className="mt-2 text-xs text-[var(--aviation-muted)]">{hint}</p>}
      </fieldset>

      {status === "More Information Required" && (
        <div>
          <label htmlFor="missing" className="text-sm font-semibold text-aviation-dark">
            What the supplier must provide <span className="font-normal text-[var(--aviation-muted)]">(one per line)</span>
          </label>
          <textarea id="missing" rows={4} value={missing} onChange={(event) => setMissing(event.target.value)} className="mt-1 w-full rounded-xl border border-aviation-border px-3 py-2 text-sm" />
        </div>
      )}

      <div>
        <label htmlFor="comments" className="text-sm font-semibold text-aviation-dark">
          Comments for the supplier
        </label>
        <textarea
          id="comments"
          rows={3}
          value={comments}
          onChange={(event) => setComments(event.target.value)}
          placeholder="Shown in the supplier's Verification Center."
          className="mt-1 w-full rounded-xl border border-aviation-border px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-aviation-error-soft px-3 py-2 text-sm text-aviation-error">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="rounded-lg bg-aviation-success-soft px-3 py-2 text-sm text-aviation-primary">
          Decision saved. The supplier sees it in their Verification Center.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-aviation-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        Save decision
      </button>
    </form>
  );
}
