import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { displayCurrencyForCountry } from "@/lib/currency";
import { getFxRates } from "@/lib/currency-server";

/** The signed-in user's display currency (KES in Kenya, USD elsewhere) and current rates. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let country: string | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("country").eq("id", user.id).maybeSingle();
    country = data?.country ?? null;
  }
  const rates = await getFxRates();
  return NextResponse.json(
    { currency: displayCurrencyForCountry(country), rates },
    { headers: { "Cache-Control": "private, max-age=300" } },
  );
}
