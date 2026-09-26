"use client";

import { useEffect, useRef } from "react";
import { Archive, AlertTriangle, EyeOff, X } from "lucide-react";

export interface ListingLifecycleContext {
  rfqCount: number;
  quoteCount: number;
  orderCount: number;
  shipmentCount: number;
  invoiceCount: number;
  hasHistory: boolean;
}

interface Props {
  open: boolean;
  partNumber: string;
  action: "delete" | "inactive" | "archive" | "publish" | "reserve" | "sold";
  context?: ListingLifecycleContext | null;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const copy = {
  delete: {
    title: "Delete draft listing?",
    body: "Permanent deletion is only available for a Draft that has never entered a buyer or transaction workflow. This cannot be undone.",
    button: "Delete draft",
    tone: "danger",
  },
  inactive: { title: "Deactivate listing?", body: "The listing will be removed from marketplace discovery while its business history and documents remain intact.", button: "Deactivate", tone: "warning" },
  archive: { title: "Archive listing?", body: "Archiving removes the listing from active marketplace workflows while preserving the listing and its historical record.", button: "Archive", tone: "neutral" },
  publish: { title: "Publish listing?", body: "The listing will become visible to buyers in the marketplace.", button: "Publish", tone: "primary" },
  reserve: { title: "Mark listing reserved?", body: "Reserved listings are no longer available as ordinary marketplace inventory. Use this only when the inventory has been committed to a buyer workflow.", button: "Mark reserved", tone: "warning" },
  sold: { title: "Mark listing sold?", body: "Sold listings are no longer available for marketplace purchase. The listing remains available to preserve its transaction history.", button: "Mark sold", tone: "neutral" },
} as const;

export default function ListingLifecycleModal({ open, partNumber, action, context, loading, onCancel, onConfirm }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) ?? []);
    window.setTimeout(() => focusable()[0]?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) { onCancel(); return; }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); previous?.focus(); };
  }, [open, loading, onCancel]);

  if (!open) return null;
  const c = copy[action];
  const hasHistory = Boolean(context?.hasHistory);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-5" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) onCancel(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="listing-lifecycle-title" className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-aviation-light text-aviation-primary">
              {action === "delete" ? <AlertTriangle size={20} /> : action === "inactive" ? <EyeOff size={20} /> : <Archive size={20} />}
            </div>
            <div>
              <h2 id="listing-lifecycle-title" className="text-xl font-bold text-aviation-dark">{c.title}</h2>
              <p className="mt-1 font-mono text-xs text-aviation-muted">{partNumber}</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} disabled={loading} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-lg text-aviation-muted hover:bg-aviation-light disabled:opacity-50"><X size={20} /></button>
        </div>

        <p className="mt-5 text-sm leading-6 text-aviation-muted">{c.body}</p>

        {hasHistory && (
          <div className="mt-5 rounded-xl border border-aviation-warning/40 bg-aviation-warning-soft p-4">
            <p className="font-semibold text-aviation-dark">Business history detected</p>
            <p className="mt-1 text-sm text-aviation-muted">{context?.rfqCount ?? 0} RFQ{context?.rfqCount === 1 ? "" : "s"} · {context?.quoteCount ?? 0} quote{context?.quoteCount === 1 ? "" : "s"} · {context?.orderCount ?? 0} purchase order{context?.orderCount === 1 ? "" : "s"} · {context?.shipmentCount ?? 0} shipment{context?.shipmentCount === 1 ? "" : "s"} · {context?.invoiceCount ?? 0} invoice{context?.invoiceCount === 1 ? "" : "s"}.</p>
            <p className="mt-2 text-sm font-medium text-aviation-dark">Use Inactive or Archived to preserve the record.</p>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={loading} className="min-h-11 rounded-xl border border-aviation-border px-5 font-semibold text-aviation-dark hover:bg-aviation-light disabled:opacity-50">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={loading || (action === "delete" && hasHistory)} className={`min-h-11 rounded-xl px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${c.tone === "danger" ? "bg-aviation-error" : c.tone === "warning" ? "bg-aviation-warning" : "bg-aviation-primary"}`}>{loading ? "Working…" : action === "delete" && hasHistory ? "Delete unavailable" : c.button}</button>
        </div>
      </div>
    </div>
  );
}
