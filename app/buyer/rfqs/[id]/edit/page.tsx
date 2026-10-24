import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

// Sent RFQs are historical records and can no longer be edited; old links open the RFQ.
export default async function EditRFQPage({ params }: Props) {
  const { id } = await params;
  redirect(`/buyer/rfqs/${id}`);
}
