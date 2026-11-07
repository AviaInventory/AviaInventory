/**
 * Cookie consent for optional (analytics and advertising) cookies.
 *
 * The visitor's choice is kept in a first-party cookie so the server can read it too.
 * Essential cookies (sign-in, security) never need consent. Optional tags must check
 * `readConsent()` (or listen for CONSENT_CHANGE_EVENT) before loading.
 */
export const CONSENT_COOKIE = "aviainventory_consent";
export const CONSENT_CHANGE_EVENT = "aviainventory:consent-change";
export const OPEN_COOKIE_SETTINGS_EVENT = "aviainventory:open-cookie-settings";

/** Bump when the categories change, so visitors are asked again. */
const CONSENT_VERSION = 1;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type ConsentChoice = { analytics: boolean; advertising: boolean };
export type StoredConsent = ConsentChoice & { v: number; at: string };

export function parseConsent(raw: string | undefined | null): StoredConsent | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(decodeURIComponent(raw)) as Partial<StoredConsent>;
    if (value.v !== CONSENT_VERSION) return null;
    return { v: CONSENT_VERSION, analytics: value.analytics === true, advertising: value.advertising === true, at: String(value.at ?? "") };
  } catch {
    return null;
  }
}

/** The raw cookie value ("" when unset), cheap enough to use as a store snapshot. */
export function readConsentRaw(): string {
  if (typeof document === "undefined") return "";
  const entry = document.cookie.split("; ").find((part) => part.startsWith(`${CONSENT_COOKIE}=`));
  return entry?.slice(CONSENT_COOKIE.length + 1) ?? "";
}

export function readConsent(): StoredConsent | null {
  return parseConsent(readConsentRaw());
}

export function writeConsent(choice: ConsentChoice): StoredConsent {
  const stored: StoredConsent = { v: CONSENT_VERSION, analytics: choice.analytics, advertising: choice.advertising, at: new Date().toISOString() };
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(stored))}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: stored }));
  return stored;
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
