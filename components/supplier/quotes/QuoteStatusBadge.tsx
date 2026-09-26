"use client";

interface QuoteStatusBadgeProps {
  status: string | null | undefined;
}

export default function QuoteStatusBadge({
  status,
}: QuoteStatusBadgeProps) {
  const normalizedStatus = (status || "Unknown").toLowerCase();

  let styles =
    "bg-aviation-light text-aviation-dark";

  if (
    normalizedStatus === "submitted" ||
    normalizedStatus === "pending"
  ) {
    styles =
      "bg-aviation-success-soft text-aviation-success";
  }

  if (
    normalizedStatus === "accepted" ||
    normalizedStatus === "approved"
  ) {
    styles =
      "bg-aviation-success-soft text-aviation-success";
  }

  if (
    normalizedStatus === "rejected" ||
    normalizedStatus === "declined"
  ) {
    styles =
      "bg-aviation-error-soft text-aviation-error";
  }

  if (
    normalizedStatus === "draft"
  ) {
    styles =
      "bg-aviation-light text-aviation-dark";
  }

  if (
    normalizedStatus === "expired"
  ) {
    styles =
      "bg-aviation-warning-soft text-aviation-warning";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles}`}
    >
      {status || "Unknown"}
    </span>
  );
}