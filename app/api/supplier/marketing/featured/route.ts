import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";

export async function POST(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.redirect(new URL("/login", request.url));
  await requireActiveSubscription("featured_listings");
  const form = await request.formData(); const listingId = String(form.get("listingId") ?? ""); if (!listingId) return NextResponse.json({ error: "Listing is required." }, { status: 400 });
  const { data: listing } = await supabase.from("parts").select("id").eq("id", listingId).eq("supplier_id", user.id).eq("status", "Published").maybeSingle(); if (!listing) return NextResponse.json({ error: "Published listing not found." }, { status: 404 });
  const limit = Math.max(1, Number(process.env.FEATURED_LISTING_LIMIT ?? "5"));
  const { count } = await supabase.from("featured_listings").select("id", { count: "exact", head: true }).eq("supplier_id", user.id).in("status", ["Submitted", "Approved", "Active"]);
  if ((count ?? 0) >= limit) return NextResponse.json({ error: `Your plan currently allows up to ${limit} featured listing requests.` }, { status: 400 });
  const { error } = await supabase.from("featured_listings").insert({ supplier_id: user.id, listing_id: listingId, status: "Submitted" }); if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.redirect(new URL("/supplier/marketing/featured", request.url));
}
