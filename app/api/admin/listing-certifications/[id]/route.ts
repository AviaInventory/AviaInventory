import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { requireAdminToken, reviewListingCertificationDocument } from "@/lib/admin-certification";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    requireAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
    const { id } = await params;
    const body = await request.json();
    const document = await reviewListingCertificationDocument({
      documentId: id,
      reviewStatus: typeof body.reviewStatus === "string" ? body.reviewStatus : "",
      verificationStatus: typeof body.verificationStatus === "string" ? body.verificationStatus : "",
      expiryDate: typeof body.expiryDate === "string" ? body.expiryDate : null,
      reviewerNotes: typeof body.reviewerNotes === "string" ? body.reviewerNotes : null,
    });
    return NextResponse.json({ success: true, document });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to review document." }, { status: 400 });
  }
}
