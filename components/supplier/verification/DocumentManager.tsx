"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Eye, FileCheck2, Loader2, Plus, RefreshCw, UploadCloud } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { documentExpiryState, type SupplierVerificationDocument } from "@/lib/supplier-verification";
import ExpiryNotice from "./ExpiryNotice";

const types = ["Certificate of Incorporation / Business Registration", "Air Operator / Maintenance Approval", "FAA 8130-3 / Authorized Release", "EASA Form 1 / Approval", "Quality Management Certificate", "Repair Station / AMO Certificate", "Insurance Certificate", "Bank / Tax Registration", "Other Compliance Document"];

export default function DocumentManager({ supplierId, initialDocuments }: { supplierId: string; initialDocuments: SupplierVerificationDocument[] }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({document_type:types[0],document_name:"",issue_date:"",expiry_date:"",issuing_authority:""});
  const expiring = useMemo(() => documents.filter((d) => ["critical","warning","expired"].includes(documentExpiryState(d.expiry_date).key)), [documents]);

  async function openDocument(doc: SupplierVerificationDocument) {
    try {
      const { data, error } = await supabase.storage.from("supplier-verification-documents").createSignedUrl(doc.storage_path, 300);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to open document."); }
  }

  async function replaceDocument(doc: SupplierVerificationDocument, replacement: File) {
    if (replacement.size > 10 * 1024 * 1024) { toast.error("Please choose a file smaller than 10 MB."); return; }
    setBusy(true);
    try {
      const ext = replacement.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${supplierId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("supplier-verification-documents").upload(path, replacement, { upsert: false, contentType: replacement.type || "application/octet-stream" });
      if (uploadError) throw uploadError;
      const { data, error } = await supabase.from("supplier_verification_documents").insert({supplier_id:supplierId,document_type:doc.document_type,document_name:doc.document_name,issue_date:doc.issue_date,expiry_date:doc.expiry_date,issuing_authority:doc.issuing_authority,storage_path:path,version:doc.version+1,uploaded_by:supplierId}).select("*").single();
      if (error) { await supabase.storage.from("supplier-verification-documents").remove([path]); throw error; }
      const { error: replaceError } = await supabase.from("supplier_verification_documents").update({verification_status:"Replaced"}).eq("id",doc.id).eq("supplier_id",supplierId);
      if (replaceError) throw replaceError;
      setDocuments(current => [data as SupplierVerificationDocument, ...current.filter(item => item.id !== doc.id)]);
      toast.success(`Document replaced with version ${doc.version+1}.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to replace document."); }
    finally { setBusy(false); }
  }

  async function upload() {
    if (!file || !form.document_name.trim()) { toast.error("Add a document name and select a file."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Please choose a file smaller than 10 MB."); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${supplierId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("supplier-verification-documents").upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
      if (uploadError) throw uploadError;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Authentication required.");
      const { data, error } = await supabase.from("supplier_verification_documents").insert({supplier_id:supplierId,document_type:form.document_type,document_name:form.document_name.trim(),issue_date:form.issue_date || null,expiry_date:form.expiry_date || null,issuing_authority:form.issuing_authority.trim() || null,storage_path:path,uploaded_by:userData.user.id}).select("*").single();
      if (error) { await supabase.storage.from("supplier-verification-documents").remove([path]); throw error; }
      setDocuments((current) => [data as SupplierVerificationDocument, ...current]); setFile(null); setForm({document_type:types[0],document_name:"",issue_date:"",expiry_date:"",issuing_authority:""}); setOpen(false); toast.success("Compliance document uploaded.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to upload document."); }
    finally { setBusy(false); }
  }

  return <section className="rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-white p-5 shadow-sm sm:p-7">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-aviation-muted">CONTROLLED DOCUMENT REGISTER</p><h2 className="mt-1 text-xl font-bold text-aviation-dark">Compliance documents</h2><p className="mt-1 text-sm text-aviation-muted">Private documents are accessible only to the supplier and authorized AviaInventory reviewers.</p></div><button onClick={()=>setOpen(true)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-aviation-primary px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16}/> Add document</button></div>
    {expiring.length > 0 && <div className="mt-5 rounded-xl border border-aviation-warning/20 bg-aviation-warning-soft p-4"><p className="text-sm font-semibold text-aviation-dark">Expiry notification</p><p className="mt-1 text-xs text-aviation-muted">{expiring.length} document{expiring.length === 1 ? " is" : "s are"} on the expiry watch list. Replace expired documents and renew those approaching expiry.</p></div>}
    <div className="mt-5 overflow-x-auto"><table className="min-w-[850px] w-full text-left text-sm"><thead><tr className="border-b border-aviation-border text-[10px] uppercase tracking-[0.12em] text-aviation-muted"><th className="pb-3 pr-4">Document</th><th className="pb-3 pr-4">Authority</th><th className="pb-3 pr-4">Version</th><th className="pb-3 pr-4">Verification</th><th className="pb-3">Expiry</th></tr></thead><tbody className="divide-y divide-aviation-border">{documents.length === 0 ? <tr><td colSpan={5} className="py-10 text-center text-sm text-aviation-muted">No compliance documents uploaded yet.</td></tr> : documents.map((doc)=><tr key={doc.id} className="align-top"><td className="py-4 pr-4"><div className="flex items-start gap-3"><div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-aviation-light text-aviation-primary"><FileCheck2 size={17}/></div><div><p className="font-semibold text-aviation-dark">{doc.document_name}</p><p className="mt-1 text-xs text-aviation-muted">{doc.document_type}</p><p className="mt-1 text-[11px] text-aviation-muted">Uploaded {new Date(doc.created_at).toLocaleDateString()}</p></div></div></td><td className="py-4 pr-4 text-aviation-muted">{doc.issuing_authority || "—"}</td><td className="py-4 pr-4 font-mono text-xs">v{doc.version}</td><td className="py-4 pr-4"><span className="rounded-full border border-aviation-border bg-aviation-light px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">{doc.verification_status}</span>{doc.reviewer_notes && <p className="mt-2 max-w-xs text-xs leading-5 text-aviation-muted">{doc.reviewer_notes}</p>}</td><td className="py-4"><ExpiryNotice expiryDate={doc.expiry_date}/><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={()=>openDocument(doc)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-aviation-border px-2.5 py-1.5 text-xs font-semibold text-aviation-primary"><Eye size={13}/> View</button><label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-aviation-border px-2.5 py-1.5 text-xs font-semibold text-aviation-primary"><RefreshCw size={13}/> Replace<input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" className="sr-only" disabled={busy} onChange={e=>{const selected=e.target.files?.[0];if(selected)void replaceDocument(doc,selected);e.currentTarget.value="";}}/></label></div></td></tr>)}</tbody></table></div>
    {open && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-aviation-dark/50 p-4" role="dialog" aria-modal="true" aria-label="Add compliance document"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-bold text-aviation-dark">Add compliance document</h3><p className="mt-1 text-sm text-aviation-muted">PDF, image or office document. Maximum recommended size is 10 MB.</p></div><button onClick={()=>setOpen(false)} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-aviation-muted">Close</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Document type"><select value={form.document_type} onChange={e=>setForm({...form,document_type:e.target.value})}>{types.map(t=><option key={t}>{t}</option>)}</select></Field><Field label="Document name"><input value={form.document_name} onChange={e=>setForm({...form,document_name:e.target.value})} placeholder="e.g. EASA Part-145 Approval"/></Field><Field label="Issue date"><input type="date" value={form.issue_date} onChange={e=>setForm({...form,issue_date:e.target.value})}/></Field><Field label="Expiry date"><input type="date" value={form.expiry_date} onChange={e=>setForm({...form,expiry_date:e.target.value})}/></Field><Field label="Issuing authority"><input value={form.issuing_authority} onChange={e=>setForm({...form,issuing_authority:e.target.value})} placeholder="e.g. EASA, FAA, KCAA"/></Field><Field label="File"><input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" onChange={e=>setFile(e.target.files?.[0] ?? null)} className="file:mr-3 file:rounded-lg file:border-0 file:bg-aviation-light file:px-3 file:py-2 file:text-xs file:font-semibold"/></Field></div><div className="mt-6 rounded-xl border border-dashed border-aviation-border bg-aviation-light p-4"><div className="flex gap-3"><UploadCloud size={20} className="text-aviation-primary"/><p className="text-xs leading-5 text-aviation-muted">The original file is stored in a private supplier folder. Public supplier profiles expose only verification status and approved trust metadata.</p></div></div><button disabled={busy} onClick={upload} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-aviation-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? <Loader2 className="animate-spin" size={17}/> : <UploadCloud size={17}/>} {busy ? "Uploading…" : "Upload for verification"}</button></div></div>}
  </section>;
}
function Field({label,children}:{label:string;children:React.ReactNode}) { return <label className="block text-sm font-semibold text-aviation-dark"><span>{label}</span><div className="mt-1.5">{children}</div></label>; }
