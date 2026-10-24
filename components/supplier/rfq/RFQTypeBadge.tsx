import { Package, Wrench } from "lucide-react";
import type { RFQType } from "@/lib/rfqs";

/** "MRO Service" (repair / overhaul) or "Aircraft Parts" RFQ. */
export default function RFQTypeBadge({ type }: { type?: RFQType | null }) {
  const mro = type === "mro";
  const Icon = mro ? Wrench : Package;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${mro ? "border-aviation-accent/30 bg-aviation-accent/10 text-aviation-warning" : "border-aviation-primary/20 bg-aviation-primary/10 text-aviation-primary"}`}>
      <Icon size={13} aria-hidden="true" />
      {mro ? "MRO Service" : "Aircraft Parts"}
    </span>
  );
}
