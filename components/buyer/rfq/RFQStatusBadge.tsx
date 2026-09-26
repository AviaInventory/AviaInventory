import StatusBadge from "@/components/dashboard/StatusBadge";
export default function RFQStatusBadge({ status }: { status: string }) {
  const label = status === "InProgress" ? "In Progress" : status;
  return <StatusBadge status={label} />;
}
