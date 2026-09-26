import { Archive, CheckCircle2, Clock3, EyeOff, PackageCheck, Send, CircleDot } from "lucide-react";

export type DashboardStatus = "Pending" | "Quoted" | "Accepted" | "Shipped" | "Delivered" | string;

const styles: Record<string, { className: string; Icon: typeof Clock3 }> = {
  pending: { className: "border-aviation-warning/20 bg-aviation-warning-soft text-aviation-warning", Icon: Clock3 },
  quoted: { className: "border-aviation-primary/20 bg-aviation-primary/10 text-aviation-primary", Icon: Send },
  accepted: { className: "border-aviation-success/20 bg-aviation-success-soft text-aviation-success", Icon: CheckCircle2 },
  shipped: { className: "border-aviation-primary/20 bg-aviation-primary/10 text-aviation-primary", Icon: PackageCheck },
  delivered: { className: "border-aviation-success/20 bg-aviation-success-soft text-aviation-success", Icon: CheckCircle2 },
  draft: { className: "border-aviation-border bg-aviation-light text-aviation-muted", Icon: CircleDot },
  published: { className: "border-aviation-success/20 bg-aviation-success-soft text-aviation-success", Icon: CheckCircle2 },
  reserved: { className: "border-aviation-warning/20 bg-aviation-warning-soft text-aviation-warning", Icon: Clock3 },
  sold: { className: "border-aviation-primary/20 bg-aviation-primary/10 text-aviation-primary", Icon: PackageCheck },
  inactive: { className: "border-aviation-border bg-aviation-light text-aviation-muted", Icon: EyeOff },
  archived: { className: "border-aviation-border bg-aviation-light text-aviation-muted", Icon: Archive },
};

export default function StatusBadge({ status }: { status: DashboardStatus }) {
  const key = status.toLowerCase();
  const item = styles[key] ?? { className: "border-aviation-border bg-aviation-light text-aviation-dark", Icon: CircleDot };
  const Icon = item.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-[var(--aviation-radius-pill)] border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.07em] ${item.className}`}>
      <Icon size={13} aria-hidden="true" />
      {status}
    </span>
  );
}
