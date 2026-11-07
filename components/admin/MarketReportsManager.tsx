"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, EyeOff, FileText, FileUp, Loader2, Trash2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import type { AdminReport } from "@/lib/admin-intelligence-reports";

const BUCKET = "market-intelligence-reports";
const PERIODS = [[30, "Last 30 days"], [90, "Last 90 days"], [180, "Last 180 days"], [365, "Last 12 months"]] as const;
const MAX_BYTES = 50 * 1024 * 1024;
const sizeLabel = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** PDF picker: a drop zone you can click or drag a file onto. */
function PdfDropZone({ file, onChange }: { file: File | null; onChange: (file: File | null) => void }) {
  const [dragging, setDragging] = useState(false);
  const accept = (candidate: File | undefined | null) => {
    if (!candidate) return;
    if (!/\.pdf$/i.test(candidate.name) && candidate.type !== "application/pdf") return toast.error("Choose a PDF file.");
    if (candidate.size > MAX_BYTES) return toast.error("The PDF must be smaller than 50 MB.");
    onChange(candidate);
  };

  if (file) {
    return (
      <div className="mt-1 flex items-center gap-3 rounded-xl border border-aviation-primary/30 bg-aviation-light p-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-aviation-primary"><FileText size={20} /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-aviation-dark">{file.name}</span>
          <span className="block text-xs text-[var(--aviation-muted)]">{sizeLabel(file.size)} · PDF</span>
        </span>
        <button type="button" onClick={() => onChange(null)} aria-label="Remove file" className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[var(--aviation-muted)] hover:bg-white hover:text-red-600" style={{ minHeight: 0 }}><X size={16} /></button>
      </div>
    );
  }

  return (
    <label
      htmlFor="report-file"
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); accept(event.dataTransfer.files?.[0]); }}
      className={`mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${dragging ? "border-aviation-primary bg-aviation-light" : "border-aviation-border hover:border-aviation-primary/60 hover:bg-aviation-light/60"}`}
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-aviation-light text-aviation-primary"><FileUp size={20} /></span>
      <span className="text-sm font-semibold text-aviation-dark">Drop a PDF here, or <span className="text-aviation-primary underline">browse</span></span>
      <span className="text-xs text-[var(--aviation-muted)]">PDF only, up to 50 MB</span>
      <input id="report-file" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { accept(event.target.files?.[0]); event.target.value = ""; }} />
    </label>
  );
}

/** Download the marketplace figures as a CSV. */
function ExportPanel() {
  const [days, setDays] = useState(90);
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-aviation-dark">Export market data</h2>
      <p className="mt-1 text-sm leading-6 text-[var(--aviation-muted)]">Download the full marketplace figures as CSV: demand by part number, category and country, MRO demand, quoted prices and response times, plus the list of reports. Companies are not named.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="export-period" className="sr-only">Period</label>
        <select id="export-period" value={days} onChange={(event) => setDays(Number(event.target.value))} className="h-10 rounded-lg border border-aviation-border bg-white px-3 text-sm text-aviation-dark outline-none focus:border-aviation-primary sm:w-48">
          {PERIODS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <a href={`/api/admin/intelligence-reports/export?days=${days}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-aviation-primary px-4 text-sm font-semibold text-white hover:opacity-90">
          <Download size={16} /> Download CSV
        </a>
      </div>
    </section>
  );
}

const inputClass = "h-10 w-full rounded-lg border border-aviation-border bg-white px-3 text-sm outline-none focus:border-aviation-primary focus:ring-2 focus:ring-aviation-primary/20";

async function postJson(url: string, body: unknown, method = "POST") {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error ?? "Something went wrong.");
  return json;
}

/** Platform console: upload, publish / hide and delete market intelligence reports. */
export default function MarketReportsManager({ reports }: { reports: AdminReport[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return toast.error("Choose a PDF to upload.");
    if (title.trim().length < 3) return toast.error("Give the report a title.");
    setUploading(true);
    try {
      const { path, token } = await postJson("/api/admin/intelligence-reports/upload-url", { fileName: file.name, fileSize: file.size });
      const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(path, token, file, { contentType: "application/pdf" });
      if (error) throw new Error(error.message);
      await postJson("/api/admin/intelligence-reports", { title, summary, category, path, fileName: file.name, fileSize: file.size });
      toast.success("Report published to Platinum users.");
      setTitle(""); setSummary(""); setCategory(""); setFile(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function act(report: AdminReport, action: "toggle" | "delete") {
    if (action === "delete" && !window.confirm(`Delete “${report.title}”? Platinum users will no longer see it.`)) return;
    setBusyId(report.id);
    try {
      if (action === "delete") await postJson(`/api/admin/intelligence-reports/${report.id}`, {}, "DELETE");
      else await postJson(`/api/admin/intelligence-reports/${report.id}`, { published: !report.published }, "PATCH");
      toast.success(action === "delete" ? "Report deleted." : report.published ? "Report hidden." : "Report published.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the change.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div className="space-y-6 self-start">
      <form onSubmit={upload} className="space-y-3 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-aviation-dark">Upload a report</h2>
        <div><label htmlFor="report-title" className="text-sm font-semibold text-aviation-dark">Title</label><input id="report-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className={inputClass} placeholder="East Africa rotables demand — Q4 2026" /></div>
        <div><label htmlFor="report-category" className="text-sm font-semibold text-aviation-dark">Category <span className="font-normal text-[var(--aviation-muted)]">(optional)</span></label><input id="report-category" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={80} className={inputClass} placeholder="Engines, Regional, MRO…" /></div>
        <div><label htmlFor="report-summary" className="text-sm font-semibold text-aviation-dark">Summary <span className="font-normal text-[var(--aviation-muted)]">(optional)</span></label><textarea id="report-summary" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={2000} rows={3} className="w-full rounded-lg border border-aviation-border px-3 py-2 text-sm outline-none focus:border-aviation-primary focus:ring-2 focus:ring-aviation-primary/20" /></div>
        <div><p className="text-sm font-semibold text-aviation-dark">PDF file</p><PdfDropZone file={file} onChange={setFile} /><p className="mt-1 text-xs text-[var(--aviation-muted)]">Stored privately; only Platinum users can open it.</p></div>
        <button type="submit" disabled={uploading} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-aviation-primary px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} {uploading ? "Uploading…" : "Upload & publish"}
        </button>
      </form>
      <ExportPanel />
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-aviation-dark">Reports ({reports.length})</h2>
        {reports.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-aviation-border p-6 text-center text-sm text-[var(--aviation-muted)]">No reports yet. Uploaded reports appear in every Platinum user&apos;s Market Intelligence page.</p> : (
          <ul className="mt-2 divide-y divide-aviation-border">
            {reports.map((report) => (
              <li key={report.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <FileText size={20} className="mt-0.5 shrink-0 text-aviation-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-semibold text-aviation-dark">{report.title} {!report.published && <span className="ml-1 rounded bg-aviation-light px-1.5 py-0.5 text-[11px] font-semibold text-[var(--aviation-muted)]">Hidden</span>}</p>
                    <p className="mt-0.5 text-xs text-[var(--aviation-muted)]">{[report.category, report.file_name, new Date(report.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a href={`/api/admin/intelligence-reports/${report.id}`} target="_blank" rel="noopener" className="inline-flex h-9 items-center rounded-lg border border-aviation-border px-3 text-sm font-semibold text-aviation-dark hover:border-aviation-primary">Open</a>
                  <button type="button" disabled={busyId === report.id} onClick={() => act(report, "toggle")} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-aviation-border px-3 text-sm font-semibold text-aviation-dark hover:border-aviation-primary">
                    {report.published ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Publish</>}
                  </button>
                  <button type="button" disabled={busyId === report.id} onClick={() => act(report, "delete")} aria-label={`Delete ${report.title}`} className="inline-flex h-9 items-center rounded-lg border border-aviation-border px-2.5 text-red-600 hover:border-red-300 hover:bg-red-50"><Trash2 size={15} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
