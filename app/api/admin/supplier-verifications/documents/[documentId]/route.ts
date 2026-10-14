import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { requireAdminToken } from "@/lib/admin-certification";
import { reviewSupplierDocument } from "@/lib/admin-supplier-verification";

/** Platform console: verify, reject or expire one supplier verification document. */
export async function PATCH(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    requireAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
  } catch {
    return NextResponse.json({ error: "Administrator session required. Sign in to the platform console again." }, { status: 401 });
  }

  try {
    const { documentId } = await params;
    const body = await request.json().catch(() => ({}));
    await reviewSupplierDocument({
      documentId,
      status: typeof body.status === "string" ? body.status : "",
      notes: typeof body.notes === "string" ? body.notes : null,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to review the document." }, { status: 400 });
  }
}
