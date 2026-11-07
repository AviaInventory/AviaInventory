import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { requireAdminToken } from "@/lib/admin-certification";
import { createReport } from "@/lib/admin-intelligence-reports";

/** Platform console: publish a market report whose PDF was uploaded with an upload link. */
export async function POST(request: Request) {
  try {
    requireAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
  } catch {
    return NextResponse.json({ error: "Administrator session required. Sign in to the platform console again." }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const report = await createReport(body);
    return NextResponse.json({ success: true, report });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to publish the report." }, { status: 400 });
  }
}
