import { Archive, TimerOff } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { RFQStatus } from "@/lib/rfqs";

// Closed and Expired are neutral end states here (the shared badge shows "Closed" as a
// completed order step). Legacy "Rejected" is always shown as "Closed".
const endStates: Partial<Record<RFQStatus, { className: string; Icon: typeof Archive }>> = {
  [RFQStatus.Closed]: { className: "border-aviation-border bg-aviation-light text-aviation-muted", Icon: Archive },
  [RFQStatus.Expired]: { className: "border-aviation-warning/20 bg-aviation-warning-soft text-aviation-warning", Icon: TimerOff },
};

export default function RFQStatusBadge({ status }: { status: RFQStatus }) {
  const shown = status === RFQStatus.Rejected ? RFQStatus.Closed : status;
  const end = endStates[shown];
  if (!end) return <StatusBadge status={shown} />;
  const Icon = end.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-[var(--aviation-radius-pill)] border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.07em] ${end.className}`}>
      <Icon size={13} aria-hidden="true" />
      {shown}
    </span>
  );
}
