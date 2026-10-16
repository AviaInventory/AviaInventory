import { NextResponse } from "next/server";
import { allowedPaidPlans } from "@/lib/billing/plans";
import { chargeAmount } from "@/lib/billing/pricing";

/** The KES amount each paid plan is charged at checkout, for display next to the USD price. */
export async function GET() {
  try {
    const plans = [...allowedPaidPlans("buyer"), ...allowedPaidPlans("hybrid")];
    const prices = Object.fromEntries(plans.map((plan) => [plan.code, {
      month: chargeAmount(plan.code, "month").amount,
      year: chargeAmount(plan.code, "year").amount,
    }]));
    return NextResponse.json({ currency: "KES", prices }, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (error) {
    console.error("BILLING PRICES ERROR:", error);
    return NextResponse.json({ error: "Prices are unavailable." }, { status: 503 });
  }
}
