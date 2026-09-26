"use client";

import { BadgeCheck, FileCheck2, ShieldCheck, Scale } from "lucide-react";

export type TrustBadgeKind = "faa" | "easa" | "dual-release" | "conformity" | "oem" | "other-document" | "verified" | "buyer-protection" | "none";

const config = {
  faa: { label: "FAA 8130-3", short: "FAA 8130-3", description: "AviaInventory has verified an FAA 8130-3 document for this listing.", className: "border-[#7b5b25]/25 bg-[#c48a3a]/10 text-[#7b5b25]", icon: FileCheck2 },
  easa: { label: "EASA Form 1", short: "EASA Form 1", description: "AviaInventory has verified an EASA Form 1 document for this listing.", className: "border-[#1f5a78]/25 bg-[#1f5a78]/10 text-[#1f5a78]", icon: FileCheck2 },
  "dual-release": { label: "Dual Release", short: "Dual Release", description: "AviaInventory has verified a Dual Release document for this listing.", className: "border-[#1f5a78]/25 bg-[#1f5a78]/10 text-[#1f5a78]", icon: FileCheck2 },
  conformity: { label: "Certificate of Conformity", short: "C of C", description: "AviaInventory has verified a Certificate of Conformity document for this listing.", className: "border-[#7b5b25]/25 bg-[#c48a3a]/10 text-[#7b5b25]", icon: FileCheck2 },
  oem: { label: "OEM documentation", short: "OEM docs", description: "AviaInventory has verified OEM documentation for this listing.", className: "border-[#16232b]/15 bg-[#16232b]/8 text-[#16232b]", icon: FileCheck2 },
  "other-document": { label: "Verified document", short: "Verified doc", description: "AviaInventory has verified a supporting document for this listing.", className: "border-[#3f7d5a]/25 bg-[#3f7d5a]/10 text-[#3f7d5a]", icon: FileCheck2 },
  verified: { label: "Verified Supplier", short: "Verified", description: "This supplier has passed AviaInventory's supplier verification process.", className: "border-[#3f7d5a]/25 bg-[#3f7d5a]/10 text-[#3f7d5a]", icon: BadgeCheck },
  "buyer-protection": { label: "Buyer Protection", short: "Buyer Protected", description: "Eligible transactions receive AviaInventory buyer-protection support.", className: "border-[#16232b]/15 bg-[#16232b]/8 text-[#16232b]", icon: ShieldCheck },
  none: { label: "No certification listed", short: "None", description: "No aviation certification document has been listed for this part.", className: "border-aviation-border bg-aviation-light text-aviation-muted", icon: Scale },
} as const;

export function TrustBadge({ kind, compact = false }: { kind: TrustBadgeKind; compact?: boolean }) {
  const item = config[kind];
  const Icon = item.icon;
  return (
    <span tabIndex={0} className={`group relative inline-flex items-center gap-1.5 rounded-[var(--aviation-radius-md)] border px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${item.className}`}>
      <Icon size={compact ? 13 : 14} strokeWidth={2} aria-hidden="true" />
      <span>{compact ? item.short : item.label}</span>
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-56 -translate-x-1/2 rounded-lg bg-aviation-dark px-3 py-2 text-left text-[11px] font-medium normal-case leading-4 tracking-normal text-white shadow-lg group-hover:block group-focus-within:block">
        {item.description}
      </span>
    </span>
  );
}

export function certificationKind(value?: string | null): TrustBadgeKind {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized.includes("8130")) return "faa";
  if (normalized.includes("easa") || normalized.includes("form 1")) return "easa";
  if (normalized.includes("dual")) return "dual-release";
  if (normalized.includes("conformity")) return "conformity";
  if (normalized.includes("oem")) return "oem";
  if (normalized && normalized !== "none") return "other-document";
  return "none";
}
