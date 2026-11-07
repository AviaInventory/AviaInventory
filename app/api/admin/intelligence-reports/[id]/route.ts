import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { requireAdminToken } from "@/lib/admin-certification";
import { adminReportUrl, deleteReport, setReportPublished } from "@/lib/admin-intelligence-reports";

async function authorised() {
  try {
    requireAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
    return true;
  } catch {
    return false;
  }
}
const unauthorised = () => NextResponse.json({ error: "Administrator session required. Sign in to the platform console again." }, { status: 401 });

/** Preview the PDF. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorised())) return unauthorised();
  try {
    return NextResponse.redirect(await adminReportUrl((await params).id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to open the report." }, { status: 404 });
  }
}

/** Publish or hide. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorised())) return unauthorised();
  try {
    const body = await request.json().catch(() => ({}));
    await setReportPublished((await params).id, Boolean(body.published));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save the change." }, { status: 400 });
  }
}

/** Delete the report and its file. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorised())) return unauthorised();
  try {
    await deleteReport((await params).id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete the report." }, { status: 400 });
  }
}
