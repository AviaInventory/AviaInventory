import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { requireAdminToken } from "@/lib/admin-certification";
import { decidePromotionRequest } from "@/lib/admin-promotions";

/** Platform console: approve or decline a supplier's listing promotion request. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
  } catch {
    return NextResponse.json({ error: "Administrator session required. Sign in to the platform console again." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    await decidePromotionRequest({ id, decision: body.decision, endDate: body.endDate });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save the change." }, { status: 400 });
  }
}
