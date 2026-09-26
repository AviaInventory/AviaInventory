"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmationModal({ open, title, description, confirmLabel = "Confirm", loading = false, onCancel, onConfirm }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape" && !loading) onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, loading, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-5" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) onCancel(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="confirmation-title" className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-aviation-error/10 text-aviation-error"><AlertTriangle size={20} /></div>
            <div><h2 id="confirmation-title" className="text-xl font-bold text-aviation-dark">{title}</h2><p className="mt-1 text-sm leading-6 text-aviation-muted">{description}</p></div>
          </div>
          <button type="button" onClick={onCancel} disabled={loading} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-lg text-aviation-muted hover:bg-aviation-light disabled:opacity-50"><X size={20} /></button>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={loading} className="min-h-11 rounded-xl border border-aviation-border px-5 font-semibold text-aviation-dark">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={loading} className="min-h-11 rounded-xl bg-aviation-error px-5 font-semibold text-white disabled:opacity-50">{loading ? "Removing…" : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
