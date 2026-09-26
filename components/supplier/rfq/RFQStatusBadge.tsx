import StatusBadge from "@/components/dashboard/StatusBadge";
import { RFQStatus } from "@/lib/rfqs";
export default function RFQStatusBadge({ status }: { status: RFQStatus }) { return <StatusBadge status={status} />; }
