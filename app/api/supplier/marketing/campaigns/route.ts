import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";

const entitlementByType = { newsletter: "newsletter_promotion", whatsapp: "whatsapp_promotion", external_advertising: "external_advertising" } as const;
export async function POST(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.redirect(new URL("/login", request.url));
  const form = await request.formData(); const requestType = String(form.get("requestType") ?? ""); if (!(requestType in entitlementByType)) return NextResponse.json({ error: "Invalid campaign type." }, { status: 400 }); await requireActiveSubscription(entitlementByType[requestType as keyof typeof entitlementByType]);
  const { error } = await supabase.from("marketing_requests").insert({ supplier_id: user.id, request_type: requestType, status: "Submitted", campaign_objective: String(form.get("campaignObjective") ?? "").trim(), target_audience: String(form.get("targetAudience") ?? "").trim(), promotional_content: String(form.get("promotionalContent") ?? "").trim(), starts_at: form.get("startsAt") ? String(form.get("startsAt")) : null, ends_at: form.get("endsAt") ? String(form.get("endsAt")) : null }); if (error) return NextResponse.json({ error: error.message }, { status: 400 }); return NextResponse.redirect(new URL(`/supplier/marketing/campaigns?type=${requestType}`, request.url));
}
