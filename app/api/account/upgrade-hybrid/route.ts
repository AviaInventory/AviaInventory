import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });

    const { data: roles, error } = await supabase.rpc("upgrade_to_hybrid_account");
    if (error) {
      console.error("HYBRID UPGRADE RPC ERROR:", error);
      return NextResponse.json({ error: error.message || "Unable to upgrade your account." }, { status: 400 });
    }

    return NextResponse.json({ success: true, roles });
  } catch (error) {
    console.error("HYBRID UPGRADE ERROR:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upgrade account." }, { status: 500 });
  }
}
