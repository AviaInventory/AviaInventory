import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase public environment variables are not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ suggestions: [] });

  try {
    const supabase = getPublicSupabase();
    const escaped = query.replace(/,/g, " ").replace(/%/g, "").replace(/_/g, "");

    // Some installations already have an NSN column while older schemas do not.
    // Detect it once per request so autocomplete remains compatible with both.
    const nsnProbe = await supabase.from("parts").select("nsn").limit(1);
    const hasNsn = !nsnProbe.error;
    const fields = hasNsn
      ? "id,part_number,description,category,manufacturer,alternate_part_number,nsn"
      : "id,part_number,description,category,manufacturer,alternate_part_number";

    let builder = supabase
      .from("parts")
      .select(fields)
      .eq("status", "Published");

    const pattern = `%${escaped}%`;
    builder = hasNsn
      ? builder.or(`part_number.ilike.${pattern},manufacturer.ilike.${pattern},alternate_part_number.ilike.${pattern},nsn.ilike.${pattern}`)
      : builder.or(`part_number.ilike.${pattern},manufacturer.ilike.${pattern},alternate_part_number.ilike.${pattern}`);

    const { data, error } = await builder.limit(8);
    if (error) throw error;

    const suggestions = (data ?? []).map((part: any) => ({
      id: part.id,
      partNumber: part.part_number,
      description: part.description || "Aircraft part listing",
      category: part.category || "Components",
    }));

    return NextResponse.json(
      { suggestions },
      { headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("MARKETPLACE AUTOCOMPLETE ERROR:", error);
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}
