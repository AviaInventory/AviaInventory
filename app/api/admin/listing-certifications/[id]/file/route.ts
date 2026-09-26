import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { getAdminListingCertificationFile, requireAdminToken } from "@/lib/admin-certification";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    requireAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
    const { id } = await params;
    const url = await getAdminListingCertificationFile(id);
    return NextResponse.redirect(url);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to open document." }, { status: 400 });
  }
}
