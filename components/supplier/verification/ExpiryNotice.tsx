"use client";

import { AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";
import { documentExpiryState } from "@/lib/supplier-verification";

export default function ExpiryNotice({ expiryDate }: { expiryDate?: string | null }) {
  const state = documentExpiryState(expiryDate);
  if (state.key === "none") return <span className="text-xs text-aviation-muted">No expiry date</span>;
  if (state.key === "expired") return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"><AlertTriangle size={13}/> {state.label}</span>;
  if (state.key === "critical") return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"><CalendarClock size={13}/> {state.label}</span>;
  if (state.key === "warning") return <span className="inline-flex items-center gap-1.5 rounded-full bg-aviation-warning-soft px-2.5 py-1 text-xs font-semibold text-aviation-warning"><CalendarClock size={13}/> {state.label}</span>;
  return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-aviation-success"><CheckCircle2 size={13}/> {state.label}</span>;
}
