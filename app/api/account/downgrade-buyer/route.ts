import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Switch a Buyer & Supplier account back to Buyer only (reverse of /api/account/upgrade-hybrid). */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });

  const { data: roles, error } = await supabase.rpc("downgrade_to_buyer_account");
  if (error) {
    // P0001 = a business rule from the database (live listings, open orders, paid plan): show it as-is.
    const status = error.code === "P0001" ? 409 : 500;
    if (status === 500) console.error("BUYER DOWNGRADE RPC ERROR:", error.message);
    return NextResponse.json(
      { error: status === 409 ? error.message : "We couldn't change your account right now. Please try again." },
      { status },
    );
  }

  return NextResponse.json({ success: true, roles });
}
