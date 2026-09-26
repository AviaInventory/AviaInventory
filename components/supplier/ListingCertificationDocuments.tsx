"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Eye, FileCheck2, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import type { PartCertificationDocument } from "@/lib/parts";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

const reviewStyles: Record<string, string> = {
  "Not reviewed": "border-aviation-border bg-white text-aviation-muted",
  "Pending review": "border-aviation-warning/30 bg-aviation-warning-soft text-aviation-warning",
  "Under review": "border-aviation-primary/25 bg-aviation-light text-aviation-primary",
  Reviewed: "border-aviation-success/20 bg-aviation-success-soft text-aviation-success",
};

const verificationStyles: Record<string, string> = {
  "Not verified": "border-aviation-border bg-aviation-light text-aviation-dark",
  Verified: "border-aviation-success/30 bg-aviation-success-soft text-aviation-success",
  Rejected: "border-aviation-error/30 bg-red-50 text-aviation-error",
  Expired: "border-aviation-warning/30 bg-aviation-warning-soft text-aviation-warning",
  Replaced: "border-aviation-border bg-aviation-light text-aviation-muted",
};

function Pill({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 font-semibold ${className}`}>{children}</span>;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value.includes("T") ? value : `${value}T12:00:00`).toLocaleDateString("en-GB");
}

export default function ListingCertificationDocuments({ partId, editable = false, initialDocuments }: { partId: string; editable?: boolean; initialDocuments?: PartCertificationDocument[] }) {
  const [documents, setDocuments] = useState<PartCertificationDocument[]>(initialDocuments ?? []);
  const [loading, setLoading] = useState(!initialDocuments);
  const [removeTarget, setRemoveTarget] = useState<PartCertificationDocument | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (initialDocuments !== undefined) {
      setDocuments(initialDocuments);
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("part_certification_documents")
        .select("*")
        .eq("part_id", partId)
        .neq("verification_status", "Replaced")
        .order("created_at", { ascending: false });
      if (mounted) {
        if (error) toast.error(error.message);
        setDocuments((data ?? []) as PartCertificationDocument[]);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [partId, initialDocuments]);

  async function openDocument(doc: PartCertificationDocument) {
    try {
      const { data, error } = await supabase.storage
        .from("part-certification-documents")
        .createSignedUrl(doc.storage_path, 300);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open document.");
    }
  }

  async function removeDocument(doc: PartCertificationDocument) {
    if (!editable) return;
    setRemoving(true);
    try {
      if (doc.review_status === "Reviewed" || doc.verification_status !== "Not verified") {
        throw new Error("Reviewed certification evidence is retained. Upload a replacement document instead.");
      }
      const { error } = await supabase.from("part_certification_documents").delete().eq("id", doc.id).eq("part_id", partId);
      if (error) throw error;
      const { error: storageError } = await supabase.storage.from("part-certification-documents").remove([doc.storage_path]);
      if (storageError) throw storageError;
      setDocuments((items) => items.filter((item) => item.id !== doc.id));
      setRemoveTarget(null);
      toast.success("Document removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove document.");
    } finally {
      setRemoving(false);
    }
  }

  if (loading) return <div className="mt-5 flex items-center gap-2 rounded-xl border border-aviation-border bg-aviation-light p-4 text-sm text-aviation-muted"><Loader2 size={16} className="animate-spin"/> Loading listing document register…</div>;
  if (!documents.length) return <div className="mt-5 rounded-xl border border-dashed border-aviation-border bg-aviation-light p-5 text-sm text-aviation-muted">No previously uploaded listing certification documents.</div>;

  return (
    <div className="mt-6 rounded-xl border border-aviation-border bg-aviation-light/60 p-4 sm:p-5">
      <div className="flex gap-3">
        <FileCheck2 className="mt-0.5 shrink-0 text-aviation-primary" size={19}/>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-aviation-dark">Listing certification register</h3>
          <p className="mt-1 text-xs leading-5 text-aviation-muted">This register belongs to this part listing. Existing uploaded documents can be opened and managed here. Supplier verification is a separate company-level control and does not automatically verify any listing document.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1060px] w-full text-left text-xs">
              <thead><tr className="border-b border-aviation-border text-[10px] uppercase tracking-[0.12em] text-aviation-muted"><th className="pb-2 pr-3">Document type</th><th className="pb-2 pr-3">Filename</th><th className="pb-2 pr-3">Upload</th><th className="pb-2 pr-3">Uploaded</th><th className="pb-2 pr-3">Review</th><th className="pb-2 pr-3">Verification</th><th className="pb-2 pr-3">Expiry</th><th className="pb-2">File</th>{editable && <th className="pb-2">Manage</th>}</tr></thead>
              <tbody className="divide-y divide-aviation-border">
                {documents.map((doc) => (
                  <tr key={doc.id} className="align-top">
                    <td className="py-3 pr-3 font-semibold">{doc.document_type}</td>
                    <td className="max-w-[220px] truncate py-3 pr-3 font-mono" title={doc.filename}>{doc.filename}</td>
                    <td className="py-3 pr-3"><Pill className="border-aviation-success/30 bg-aviation-success-soft text-aviation-success">{doc.upload_status}</Pill></td>
                    <td className="py-3 pr-3 whitespace-nowrap">{formatDate(doc.uploaded_at)}</td>
                    <td className="py-3 pr-3"><Pill className={reviewStyles[doc.review_status] || reviewStyles["Not reviewed"]}>{doc.review_status}</Pill></td>
                    <td className="py-3 pr-3"><Pill className={verificationStyles[doc.verification_status] || verificationStyles["Not verified"]}>{doc.verification_status}</Pill></td>
                    <td className="py-3 pr-3 whitespace-nowrap">{formatDate(doc.expiry_date)}</td>
                    <td className="py-3"><button type="button" onClick={() => void openDocument(doc)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-aviation-border bg-white px-2.5 font-semibold text-aviation-primary hover:border-aviation-primary"><Eye size={13}/> View</button></td>{editable && <td className="py-3">{doc.review_status !== "Reviewed" && doc.verification_status === "Not verified" ? <button type="button" onClick={() => setRemoveTarget(doc)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-aviation-error/30 bg-white px-2.5 font-semibold text-aviation-error"><Trash2 size={13}/> Remove</button> : <span className="text-[11px] text-aviation-muted">Retained after review</span>}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {documents.some((doc) => doc.verification_status === "Rejected" || doc.verification_status === "Expired") && (
            <div className="mt-4 flex gap-2 rounded-lg border border-aviation-warning/20 bg-aviation-warning-soft p-3 text-xs leading-5 text-aviation-muted"><AlertTriangle className="mt-0.5 shrink-0 text-aviation-warning" size={15}/><span>Rejected or expired documentation must not be presented to buyers as current or verified. A replacement document must go through the same independent review process.</span></div>
          )}
          {documents.some((doc) => doc.verification_status === "Not verified") && (
            <div className="mt-3 flex gap-2 rounded-lg border border-aviation-primary/15 bg-white p-3 text-xs leading-5 text-aviation-muted"><FileCheck2 className="mt-0.5 shrink-0 text-aviation-primary" size={15}/><span>Uploaded is not the same as reviewed, and reviewed is not automatically the same as verified. Only the AviaInventory review workflow can produce the Verified state.</span></div>
          )}
        </div>
      </div>
      {removeTarget && <ConfirmationModal open title="Remove certification document?" description={`Remove ${removeTarget.filename} from this listing? The document will no longer be attached to the listing.`} confirmLabel="Remove document" loading={removing} onCancel={() => !removing && setRemoveTarget(null)} onConfirm={() => void removeDocument(removeTarget)} />}
    </div>
  );
}
