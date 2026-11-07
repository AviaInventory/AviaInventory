/**
 * Display currency and conversion, shared by server and browser code (no secrets here).
 *
 * Users in Kenya see amounts in KES; everyone else sees USD. Rates are "units per 1 USD"
 * (USD = 1, KES = BILLING_USD_KES_RATE, …) and come from /api/currency on the client or
 * getFxRates() (lib/currency-server.ts) on the server.
 */

export type DisplayCurrency = "KES" | "USD";
export type FxRates = Record<string, number>;

export function displayCurrencyForCountry(country: string | null | undefined): DisplayCurrency {
  const value = (country ?? "").trim().toLowerCase();
  return value === "kenya" || value === "ke" ? "KES" : "USD";
}

/** Converts between any two currencies in `rates`; null when either rate is missing. */
export function convertAmount(amount: number, from: string | null | undefined, to: string, rates: FxRates): number | null {
  const source = (from || "USD").toUpperCase();
  const target = to.toUpperCase();
  if (!Number.isFinite(amount)) return null;
  if (source === target) return amount;
  const fromRate = rates[source];
  const toRate = rates[target];
  if (!fromRate || !toRate) return null;
  return (amount / fromRate) * toRate;
}

export function formatMoney(amount: number, currency: string): string {
  return `${currency.toUpperCase()} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
