import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { requireAdminToken } from "@/lib/admin-certification";
import { buildMarketIntelligenceCsv } from "@/lib/admin-market-export";
import { parsePeriod } from "@/lib/market-intelligence";

/** Platform console: download the marketplace's market intelligence as CSV (?days=30|90|180|365). */
export async function GET(request: NextRequest) {
  try {
    requireAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
  } catch {
    return NextResponse.json({ error: "Administrator session required. Sign in to the platform console again." }, { status: 401 });
  }
  try {
    const days = parsePeriod(request.nextUrl.searchParams.get("days") ?? undefined);
    const csv = await buildMarketIntelligenceCsv(days);
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="aviainventory-market-intelligence-${days}d-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("ADMIN MARKET EXPORT ERROR:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to build the export." }, { status: 500 });
  }
}
