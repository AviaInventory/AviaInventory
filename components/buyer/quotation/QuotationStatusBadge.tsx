interface Props {
  status: string;
}

const statusStyles: Record<string, string> = {
  Draft:
    "bg-aviation-light text-aviation-dark",

  Submitted:
    "bg-aviation-success-soft text-aviation-success",

  UnderReview:
    "bg-aviation-warning-soft text-aviation-warning",

  Accepted:
    "bg-aviation-success-soft text-aviation-success",

  Sent:
    "bg-aviation-success-soft text-aviation-primary",

  Closed:
    "bg-aviation-light text-aviation-dark",

  Expired:
    "bg-aviation-warning-soft text-aviation-warning",

  Withdrawn:
    "bg-aviation-light text-aviation-dark",
};

export default function QuotationStatusBadge({
  status,
}: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        statusStyles[status] ??
        "bg-aviation-light text-aviation-dark"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(status: string) {
  switch (status) {
    case "UnderReview":
      return "Under Review";

    case "Sent":
      return "Awaiting decision";

    // Legacy value: shown as Closed, never as "Rejected".
    case "Rejected":
      return "Closed";

    default:
      return status;
  }
}