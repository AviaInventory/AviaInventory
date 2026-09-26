"use client";

import { AlertTriangle, BadgeCheck, CircleDot, FileCheck2, Hourglass, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import type { SupplierVerificationStatus } from "@/lib/supplier-verification";

const config: Record<SupplierVerificationStatus, { icon: typeof CircleDot; className: string; label: string }> = {
  Draft: { icon: CircleDot, className: "border-aviation-border bg-aviation-light text-aviation-muted", label: "Draft" },
  Submitted: { icon: FileCheck2, className: "border-aviation-primary/20 bg-aviation-primary/10 text-aviation-primary", label: "Submitted" },
  "Under Review": { icon: Hourglass, className: "border-aviation-warning/25 bg-aviation-warning-soft text-aviation-warning", label: "Under Review" },
  "More Information Required": { icon: AlertTriangle, className: "border-aviation-warning/25 bg-aviation-warning-soft text-aviation-warning", label: "More Information Required" },
  Verified: { icon: BadgeCheck, className: "border-aviation-success/25 bg-aviation-success-soft text-aviation-success", label: "Verified" },
  Suspended: { icon: ShieldAlert, className: "border-red-200 bg-red-50 text-red-700", label: "Suspended" },
  Rejected: { icon: XCircle, className: "border-red-200 bg-red-50 text-red-700", label: "Rejected" },
};

export default function VerificationStatusBadge({ status, compact = false }: { status: SupplierVerificationStatus | string; compact?: boolean }) {
  const item = config[status as SupplierVerificationStatus] ?? { icon: ShieldCheck, className: "border-aviation-border bg-aviation-light text-aviation-dark", label: status };
  const Icon = item.icon;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${item.className}`}><Icon size={compact ? 13 : 14} aria-hidden="true" />{compact ? (item.label === "More Information Required" ? "Action Required" : item.label) : item.label}</span>;
}
