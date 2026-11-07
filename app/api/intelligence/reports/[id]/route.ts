import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { REPORTS_BUCKET } from "@/lib/market-intelligence";

/**
 * Opens a market report for a Platinum user. The report row is read as the user, so the
 * database's Platinum check decides access; the private file is then served through a
 * signed link that expires after a few minutes.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`/login?next=/supplier/marketing/intelligence`, request.url));

  const { data: report } = await supabase
    .from("market_intelligence_reports")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();
  if (!report) return NextResponse.json({ error: "Report not found, or it is part of the Platinum plan." }, { status: 404 });

  const { data, error } = await createAdminClient().storage.from(REPORTS_BUCKET).createSignedUrl(report.file_path, 300);
  if (error || !data?.signedUrl) {
    console.error("MARKET REPORT LINK ERROR:", error?.message);
    return NextResponse.json({ error: "The report could not be opened. Please try again." }, { status: 500 });
  }
  return NextResponse.redirect(data.signedUrl);
}
