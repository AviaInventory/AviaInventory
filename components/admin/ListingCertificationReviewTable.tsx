"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { AdminListingCertificationRow } from "@/lib/admin-certification";

const reviewStatuses = ["Not reviewed", "Pending review", "Under review", "Reviewed"];
const verificationStatuses = ["Not verified", "Verified", "Rejected", "Expired", "Replaced"];

function date(value: string | null) { return value ? new Date(value.includes("T") ? value : `${value}T12:00:00`).toLocaleDateString("en-GB") : "—"; }

export default function ListingCertificationReviewTable({ initialDocuments }: { initialDocuments: AdminListingCertificationRow[] }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [filter, setFilter] = useState("Needs review");
  const [saving, setSaving] = useState<string | null>(null);

  const visible = useMemo(() => documents.filter((doc) => filter === "All" || (filter === "Needs review" ? doc.review_status !== "Reviewed" || doc.verification_status === "Not verified" : doc.verification_status === filter)), [documents, filter]);

  async function save(doc: AdminListingCertificationRow, reviewStatus: string, verificationStatus: string, expiryDate: string, notes: string) {
    if (["Verified", "Rejected", "Expired"].includes(verificationStatus) && reviewStatus !== "Reviewed") { toast.error("Review the document before assigning a final verification outcome."); return; }
    setSaving(doc.id);
    try {
      const response = await fetch(`/api/admin/listing-certifications/${doc.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewStatus, verificationStatus, expiryDate: expiryDate || null, reviewerNotes: notes }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save review.");
      setDocuments((current) => current.map((item) => item.id === doc.id ? { ...item, ...result.document } : item));
      toast.success("Listing document review saved.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save review."); }
    finally { setSaving(null); }
  }

  return <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div><h2 className="text-xl font-bold text-aviation-dark">Document queue</h2><p className="mt-1 text-sm text-aviation-muted">No supplier-facing control can change the review or verification fields shown here.</p></div>
      <select value={filter} onChange={(e) => setFilter(e.target.value)} className="min-h-11 rounded-xl border border-aviation-border px-3 text-sm font-semibold"><option>Needs review</option><option>All</option><option>Verified</option><option>Rejected</option><option>Expired</option><option>Not verified</option></select>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-[1180px] w-full text-left text-xs">
        <thead className="bg-aviation-light text-[10px] uppercase tracking-[0.12em] text-aviation-muted"><tr><th className="px-5 py-3">Listing / supplier</th><th className="px-5 py-3">Declared type</th><th className="px-5 py-3">File / upload</th><th className="px-5 py-3">Review</th><th className="px-5 py-3">Verification</th><th className="px-5 py-3">Expiry</th><th className="px-5 py-3">Reviewer notes</th><th className="px-5 py-3">Action</th></tr></thead>
        <tbody className="divide-y divide-aviation-border">
          {visible.map((doc) => <ReviewRow key={doc.id} doc={doc} saving={saving === doc.id} onSave={save} />)}
        </tbody>
      </table>
      {!visible.length && <p className="p-10 text-center text-sm text-aviation-muted">No listing certification documents match this view.</p>}
    </div>
  </section>;
}

function ReviewRow({ doc, saving, onSave }: { doc: AdminListingCertificationRow; saving: boolean; onSave: (doc: AdminListingCertificationRow, review: string, verification: string, expiry: string, notes: string) => Promise<void> }) {
  const [review, setReview] = useState(doc.review_status);
  const [verification, setVerification] = useState(doc.verification_status);
  const [expiry, setExpiry] = useState(doc.expiry_date || "");
  const [notes, setNotes] = useState(doc.reviewer_notes || "");
  return <tr className="align-top">
    <td className="px-5 py-4"><p className="font-mono font-bold text-aviation-primary">{doc.part_number}</p><p className="mt-1 font-semibold text-aviation-dark">{doc.supplier_name}</p></td>
    <td className="px-5 py-4 font-semibold">{doc.document_type}</td>
    <td className="px-5 py-4"><p className="max-w-[190px] truncate font-mono" title={doc.filename}>{doc.filename}</p><p className="mt-1 text-aviation-muted">{doc.upload_status} · {date(doc.uploaded_at)}</p><a className="mt-2 inline-flex items-center gap-1 font-semibold text-aviation-primary" href={`/api/admin/listing-certifications/${doc.id}/file`} target="_blank" rel="noreferrer">Open file <ExternalLink size={12}/></a></td>
    <td className="px-5 py-4"><select value={review} onChange={(e) => setReview(e.target.value)} className="min-h-10 w-40 rounded-lg border border-aviation-border px-2"><option>{reviewStatuses[0]}</option><option>{reviewStatuses[1]}</option><option>{reviewStatuses[2]}</option><option>{reviewStatuses[3]}</option></select></td>
    <td className="px-5 py-4"><select value={verification} onChange={(e) => setVerification(e.target.value)} className="min-h-10 w-36 rounded-lg border border-aviation-border px-2"><option>{verificationStatuses[0]}</option><option>{verificationStatuses[1]}</option><option>{verificationStatuses[2]}</option><option>{verificationStatuses[3]}</option><option>{verificationStatuses[4]}</option></select></td>
    <td className="px-5 py-4"><input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="min-h-10 rounded-lg border border-aviation-border px-2" /></td>
    <td className="px-5 py-4"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-56 rounded-lg border border-aviation-border p-2 text-xs" placeholder="Evidence review notes" /></td>
    <td className="px-5 py-4"><button type="button" disabled={saving} onClick={() => void onSave(doc, review, verification, expiry, notes)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-aviation-primary px-3 text-xs font-bold text-white disabled:opacity-50"><Save size={14}/>{saving ? "Saving…" : "Save"}</button><p className="mt-2 max-w-[150px] text-[11px] leading-4 text-aviation-muted">Verified requires Reviewed. Supplier verification is unaffected.</p></td>
  </tr>;
}
