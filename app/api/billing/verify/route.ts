import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTransaction } from "@/lib/billing/paystack";
import { applySuccessfulCharge } from "@/lib/billing/apply-payment";

/**
 * Called by the subscription page when Paystack redirects back (?reference=…).
 * Confirms the payment with Paystack directly, so the plan activates even before
 * (or without) the webhook arriving. The webhook applies the same charge idempotently.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });

    const reference = new URL(request.url).searchParams.get("reference")?.trim();
    if (!reference || !/^[A-Za-z0-9._=-]{6,100}$/.test(reference)) {
      return NextResponse.json({ error: "Missing payment reference." }, { status: 400 });
    }

    const tx = await verifyTransaction(reference);
    const metadata = typeof tx.metadata === "string" ? JSON.parse(tx.metadata || "{}") : (tx.metadata ?? {});
    if (metadata.user_id !== user.id) return NextResponse.json({ error: "Payment not found." }, { status: 404 });

    if (tx.status !== "success") {
      const message = tx.status === "abandoned"
        ? "The payment was not completed. You can try again whenever you're ready."
        : tx.status === "failed"
          ? "The payment failed. Please try again or use another payment method."
          : "The payment is still being processed. This page will update once it is confirmed.";
      return NextResponse.json({ status: tx.status, message });
    }

    const result = await applySuccessfulCharge(tx);
    if (!result.applied && result.reason === "amount_mismatch") {
      return NextResponse.json({ status: "review", message: "We received your payment but need to review it. Our team will contact you shortly." });
    }
    return NextResponse.json({ status: "success", message: "Payment received. Your plan is now active." });
  } catch (error) {
    console.error("BILLING VERIFY ERROR:", error);
    return NextResponse.json({ error: "We couldn't confirm the payment yet. Refresh this page in a moment." }, { status: 502 });
  }
}
