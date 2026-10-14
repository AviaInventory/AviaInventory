import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { requireAdminToken } from "@/lib/admin-certification";
import { getSupplierDocumentFileUrl } from "@/lib/admin-supplier-verification";

/** Platform console: open a private supplier document through a 5-minute signed link. */
export async function GET(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    requireAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
  } catch {
    return NextResponse.json({ error: "Administrator session required." }, { status: 401 });
  }

  try {
    const { documentId } = await params;
    return NextResponse.redirect(await getSupplierDocumentFileUrl(documentId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to open the document." }, { status: 400 });
  }
}
