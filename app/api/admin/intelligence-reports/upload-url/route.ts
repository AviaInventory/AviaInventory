import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { requireAdminToken } from "@/lib/admin-certification";
import { createReportUploadUrl } from "@/lib/admin-intelligence-reports";

/** Platform console: a one-time link to upload a report PDF straight to private storage. */
export async function POST(request: Request) {
  try {
    requireAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
  } catch {
    return NextResponse.json({ error: "Administrator session required. Sign in to the platform console again." }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const upload = await createReportUploadUrl(String(body.fileName ?? ""), Number(body.fileSize ?? 0));
    return NextResponse.json({ success: true, ...upload });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to prepare the upload." }, { status: 400 });
  }
}
