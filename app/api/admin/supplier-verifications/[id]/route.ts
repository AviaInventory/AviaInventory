import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { requireAdminToken } from "@/lib/admin-certification";
import { decideSupplierVerification } from "@/lib/admin-supplier-verification";

/** Platform console: set a supplier's verification status. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
  } catch {
    return NextResponse.json({ error: "Administrator session required. Sign in to the platform console again." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    await decideSupplierVerification({
      supplierId: id,
      status: typeof body.status === "string" ? body.status : "",
      comments: typeof body.comments === "string" ? body.comments : null,
      missingInformation: Array.isArray(body.missingInformation) ? body.missingInformation.filter((item: unknown) => typeof item === "string") : [],
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save the decision." }, { status: 400 });
  }
}
