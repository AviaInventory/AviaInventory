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

  Rejected:
    "bg-aviation-error-soft text-aviation-error",

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

    default:
      return status;
  }
}