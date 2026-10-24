"use client";

interface QuoteStatusBadgeProps {
  status: string | null | undefined;
}

// Quotations that were not selected are "Closed"; legacy "Rejected" is shown that way too.
const styles: Record<string, string> = {
  sent: "bg-aviation-primary/10 text-aviation-primary",
  submitted: "bg-aviation-primary/10 text-aviation-primary",
  pending: "bg-aviation-primary/10 text-aviation-primary",
  accepted: "bg-aviation-success-soft text-aviation-success",
  approved: "bg-aviation-success-soft text-aviation-success",
  closed: "bg-aviation-light text-aviation-muted",
  expired: "bg-aviation-warning-soft text-aviation-warning",
  draft: "bg-aviation-light text-aviation-dark",
};

export default function QuoteStatusBadge({
  status,
}: QuoteStatusBadgeProps) {
  const raw = status || "Unknown";
  const label = ["rejected", "declined"].includes(raw.toLowerCase()) ? "Closed" : raw;

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[label.toLowerCase()] ?? "bg-aviation-light text-aviation-dark"}`}
    >
      {label}
    </span>
  );
}
