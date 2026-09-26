import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";

export async function POST(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.redirect(new URL("/login", request.url)); await requireActiveSubscription("promotions");
  const form = await request.formData(); const title = String(form.get("title") ?? "").trim(); const description = String(form.get("description") ?? "").trim(); const discount = String(form.get("discount") ?? "").trim(); if (!title || !description) return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
  const { error } = await supabase.from("promotions").insert({ supplier_id: user.id, title, description, discount: discount || null, status: "Submitted" }); if (error) return NextResponse.json({ error: error.message }, { status: 400 }); return NextResponse.redirect(new URL("/supplier/marketing/promotions", request.url));
}
