import "server-only";

import type { FxRates } from "@/lib/currency";

/** Currencies the marketplace accepts on listings and quotes. */
const SUPPORTED = ["USD", "KES", "EUR", "GBP", "AED", "ZAR"] as const;

/** FX_RATES_PER_USD="EUR=0.92,GBP=0.79,AED=3.6725,ZAR=18.2" (units per 1 USD). */
function configuredRates(): FxRates {
  const rates: FxRates = {};
  for (const pair of (process.env.FX_RATES_PER_USD ?? "").split(",")) {
    const [code, value] = pair.split("=").map((part) => part?.trim());
    const rate = Number(value);
    if (code && Number.isFinite(rate) && rate > 0) rates[code.toUpperCase()] = rate;
  }
  return rates;
}

/** Public daily rates (no key), cached for a day. Used only for currencies not configured. */
async function marketRates(): Promise<FxRates> {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 86_400 } });
    if (!response.ok) return {};
    const body = (await response.json()) as { result?: string; rates?: Record<string, number> };
    return body.result === "success" && body.rates ? body.rates : {};
  } catch {
    return {};
  }
}

/**
 * Units per 1 USD for the supported currencies.
 * KES always uses BILLING_USD_KES_RATE (the billing rate), then FX_RATES_PER_USD,
 * then the day's market rate.
 */
export async function getFxRates(): Promise<FxRates> {
  const configured = configuredRates();
  const kes = Number(process.env.BILLING_USD_KES_RATE);
  if (Number.isFinite(kes) && kes > 0) configured.KES = kes;

  const missing = SUPPORTED.filter((code) => code !== "USD" && !configured[code]);
  const market = missing.length ? await marketRates() : {};

  const rates: FxRates = { USD: 1 };
  for (const code of SUPPORTED) {
    if (code === "USD") continue;
    const rate = configured[code] ?? market[code];
    if (rate && rate > 0) rates[code] = rate;
  }
  return rates;
}
