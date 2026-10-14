import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";

export type Country = { code: CountryCode; name: string; dialCode: string };

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** Every country with an international dialling code, sorted by English name. */
export const COUNTRIES: Country[] = getCountries()
  .map((code) => ({ code, name: regionNames.of(code) ?? code, dialCode: `+${getCountryCallingCode(code)}` }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function findCountryByName(name: string | null | undefined): Country | undefined {
  if (!name) return undefined;
  const normalized = name.trim().toLowerCase();
  return COUNTRIES.find((country) => country.name.toLowerCase() === normalized);
}

/**
 * Puts the new country's dialling code in front of a phone number, replacing the
 * previous country's code if the user hadn't typed anything else yet.
 */
export function phoneWithDialCode(phone: string, previous: Country | undefined, next: Country): string {
  const trimmed = phone.trim();
  if (!trimmed || (previous && trimmed === previous.dialCode)) return `${next.dialCode} `;
  if (previous && trimmed.startsWith(previous.dialCode)) return next.dialCode + trimmed.slice(previous.dialCode.length);
  if (trimmed.startsWith("+")) return phone;
  return `${next.dialCode} ${trimmed.replace(/^0+/, "")}`;
}
