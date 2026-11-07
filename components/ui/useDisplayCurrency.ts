"use client";

import { useCallback, useEffect, useState } from "react";
import { convertAmount, formatMoney, type DisplayCurrency, type FxRates } from "@/lib/currency";

type State = { currency: DisplayCurrency; rates: FxRates | null };
let cached: Promise<State> | null = null;

function load(): Promise<State> {
  cached ??= fetch("/api/currency")
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
    .then((body: { currency: DisplayCurrency; rates: FxRates }) => ({ currency: body.currency, rates: body.rates }))
    .catch(() => {
      cached = null; // try again next time
      return { currency: "USD" as DisplayCurrency, rates: null };
    });
  return cached;
}

/**
 * The viewer's display currency (KES in Kenya, USD elsewhere) with helpers to convert and
 * format amounts from any order currency. `ready` is false until the rates have loaded.
 */
export function useDisplayCurrency() {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    let active = true;
    load().then((next) => { if (active) setState(next); });
    return () => { active = false; };
  }, []);

  const currency = state?.currency ?? "USD";
  const convert = useCallback(
    (amount: number, from: string | null | undefined) => (state?.rates ? convertAmount(amount, from, currency, state.rates) : null),
    [state, currency],
  );
  /** Formatted in the display currency, or null when it can't be converted yet. */
  const format = useCallback(
    (amount: number, from: string | null | undefined) => {
      const converted = convert(amount, from);
      return converted == null ? null : formatMoney(converted, currency);
    },
    [convert, currency],
  );

  return { currency, ready: Boolean(state?.rates), convert, format };
}
