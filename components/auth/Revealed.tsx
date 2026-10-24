"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Gated from "./Gated";
import { useSignedIn } from "./useSignedIn";

/*
 * Supplier names and part prices are not readable by logged-out visitors (the database
 * withholds them from the anon role), so public pages render without them. For signed-in
 * users these components fetch the values with the user's session, batched per page:
 * all names (or prices) requested in the same tick are loaded with one query.
 */

type Loader<T> = (ids: string[]) => Promise<Map<string, T>>;

function batched<T>(load: Loader<T>) {
  const cache = new Map<string, Promise<T | null>>();
  let queue: { id: string; resolve: (value: T | null) => void }[] = [];

  function flush() {
    const pending = queue;
    queue = [];
    const ids = [...new Set(pending.map((item) => item.id))];
    load(ids)
      .then((found) => pending.forEach((item) => item.resolve(found.get(item.id) ?? null)))
      .catch(() => pending.forEach((item) => item.resolve(null)));
  }

  return (id: string) => {
    if (!cache.has(id)) {
      cache.set(id, new Promise<T | null>((resolve) => {
        if (!queue.length) queueMicrotask(flush);
        queue.push({ id, resolve });
      }));
    }
    return cache.get(id)!;
  };
}

type SupplierInfo = { company_name: string | null; website: string | null };

const supplierInfo = batched<SupplierInfo>(async (ids) => {
  const { data } = await supabase.from("suppliers").select("id, company_name, website").in("id", ids);
  return new Map((data ?? []).map((row) => [row.id, row as SupplierInfo]));
});

type PriceInfo = { unit_price: number | null; currency: string | null; price_type: string | null; price_basis: string | null };

const partPrice = batched<PriceInfo>(async (ids) => {
  const { data } = await supabase.from("parts").select("id, unit_price, currency, price_type, price_basis").in("id", ids);
  return new Map((data ?? []).map((row) => [row.id, row as PriceInfo]));
});

function useRevealed<T>(id: string | null | undefined, fetcher: (id: string) => Promise<T | null>) {
  const signedIn = useSignedIn();
  const [value, setValue] = useState<{ id: string; value: T | null } | null>(null);

  useEffect(() => {
    if (!signedIn || !id) return;
    let active = true;
    fetcher(id).then((result) => {
      if (active) setValue({ id, value: result });
    });
    return () => {
      active = false;
    };
  }, [signedIn, id, fetcher]);

  return { signedIn, value: value && value.id === id ? value.value : undefined };
}

/** Supplier company name for signed-in users; a sign-in prompt for visitors. */
export function SupplierName({
  supplierId,
  label = "Sign in to view supplier",
  fallback = "Verified Supplier",
  className = "",
  compact = false,
}: {
  supplierId: string | null | undefined;
  label?: string;
  fallback?: string;
  className?: string;
  compact?: boolean;
}) {
  const { value } = useRevealed(supplierId, supplierInfo);
  return (
    <Gated label={label} className={className} compact={compact}>
      {value === undefined ? <span className="inline-block h-[1em] w-24 animate-pulse rounded bg-aviation-light align-middle" aria-label="Loading" /> : value?.company_name || fallback}
    </Gated>
  );
}

/** Link to the supplier's website, for signed-in users only (nothing for visitors). */
export function SupplierWebsite({ supplierId, className = "", children }: { supplierId: string; className?: string; children: React.ReactNode }) {
  const { signedIn, value } = useRevealed(supplierId, supplierInfo);
  const website = signedIn ? value?.website?.trim() : null;
  if (!website) return null;
  return (
    <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

export function formatPartPrice(price: PriceInfo) {
  if (price.price_type === "request_quote" || price.unit_price == null) return "Request a Quote";
  const amount = `${price.currency || "USD"} ${Number(price.unit_price).toLocaleString()}`;
  return price.price_basis === "lot" ? `${amount} per lot` : amount;
}

/** Part price for signed-in users; a sign-in prompt for visitors. */
export function PartPrice({
  partId,
  label = "Sign in to view price",
  className = "",
  compact = false,
  format = formatPartPrice,
}: {
  partId: string | null | undefined;
  label?: string;
  className?: string;
  compact?: boolean;
  format?: (price: PriceInfo) => string;
}) {
  const { value } = useRevealed(partId, partPrice);
  return (
    <Gated label={label} className={className} compact={compact}>
      {value === undefined ? <span className="inline-block h-[1em] w-20 animate-pulse rounded bg-aviation-light align-middle" aria-label="Loading" /> : value ? format(value) : "Request a Quote"}
    </Gated>
  );
}
