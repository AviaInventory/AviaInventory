"use client";

import Link from "next/link";
import Script from "next/script";
import { Cookie } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  CONSENT_CHANGE_EVENT,
  OPEN_COOKIE_SETTINGS_EVENT,
  parseConsent,
  readConsent,
  readConsentRaw,
  writeConsent,
  type ConsentChoice,
} from "@/lib/consent";

// Set these in the environment to switch the tags on. Each loads only after the visitor consents.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const CATEGORIES: { key: keyof ConsentChoice | "necessary"; title: string; text: string }[] = [
  { key: "necessary", title: "Necessary", text: "Sign-in, security and saving your drafts. Always on — the site cannot work without them." },
  { key: "analytics", title: "Analytics", text: "Help us understand how the site is used so we can improve it." },
  { key: "advertising", title: "Advertising", text: "Measure our ads and show you relevant AviaInventory ads on other sites." },
];

// Server render has no cookie access: render nothing there, so the banner never flashes for returning visitors.
const SERVER_SNAPSHOT = "\u0000server";

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
}

/** Consent banner, cookie-settings dialog and consent-gated analytics / advertising tags. */
export default function CookieConsent() {
  const raw = useSyncExternalStore(subscribe, readConsentRaw, () => SERVER_SNAPSHOT);
  // undefined: not known yet (server render); null: the visitor has not chosen.
  const consent = useMemo(() => (raw === SERVER_SNAPSHOT ? undefined : parseConsent(raw)), [raw]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customising, setCustomising] = useState(false);
  const [draft, setDraft] = useState<ConsentChoice>({ analytics: false, advertising: false });
  const open = consent === null || settingsOpen;

  useEffect(() => {
    const reopen = () => {
      const current = readConsent();
      setDraft({ analytics: current?.analytics ?? false, advertising: current?.advertising ?? false });
      setCustomising(true);
      setSettingsOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  function save(choice: ConsentChoice) {
    const previous = consent;
    writeConsent(choice);
    setSettingsOpen(false);
    setCustomising(false);
    // Tags that already loaded cannot be unloaded; reload so withdrawn consent takes effect at once.
    if ((previous?.analytics && !choice.analytics) || (previous?.advertising && !choice.advertising)) window.location.reload();
  }

  return (
    <>
      {GA_MEASUREMENT_ID && consent?.analytics && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`}
          </Script>
        </>
      )}
      {META_PIXEL_ID && consent?.advertising && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      )}

      {open && (
        <div role="dialog" aria-modal="false" aria-labelledby="cookie-consent-title" className="fixed inset-x-0 bottom-0 z-[200] p-4 sm:p-6">
          <div className="mx-auto max-w-3xl rounded-xl border border-aviation-border bg-white p-4 shadow-[0_12px_40px_rgba(6,35,63,0.22)] sm:p-5">
            <div className="flex items-start gap-3">
              <Cookie size={20} className="mt-0.5 hidden shrink-0 text-aviation-primary sm:block" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h2 id="cookie-consent-title" className="text-sm font-bold text-aviation-dark">We use cookies</h2>
                <p className="mt-1 text-xs leading-5 text-aviation-muted">
                  Necessary cookies keep the site working. With your permission we also use analytics and advertising cookies. You can change
                  your choice at any time from “Cookie settings” at the bottom of every page. See our{" "}
                  <Link href="/cookies" className="font-semibold text-aviation-primary underline">Cookie Policy</Link>.
                </p>

                {customising && (
                  <ul className="mt-3 divide-y divide-aviation-border rounded-md border border-aviation-border">
                    {CATEGORIES.map((category) => {
                      const fixed = category.key === "necessary";
                      const checked = fixed ? true : draft[category.key as keyof ConsentChoice];
                      return (
                        <li key={category.key}>
                          <label className={`flex items-start gap-3 px-3 py-2.5 ${fixed ? "" : "cursor-pointer"}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={fixed}
                              onChange={(event) => setDraft((current) => ({ ...current, [category.key]: event.target.checked }))}
                              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--aviation-primary)]"
                            />
                            <span>
                              <span className="block text-sm font-semibold text-aviation-dark">{category.title}{fixed && <span className="ml-1 text-xs font-normal text-aviation-muted">(always on)</span>}</span>
                              <span className="block text-xs leading-5 text-aviation-muted">{category.text}</span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                  {customising ? (
                    <button type="button" onClick={() => save(draft)} className="h-10 rounded-md border border-aviation-border bg-white px-4 text-sm font-semibold text-aviation-dark hover:border-aviation-primary sm:h-9">
                      Save choices
                    </button>
                  ) : (
                    <button type="button" onClick={() => setCustomising(true)} className="h-10 rounded-md px-4 text-sm font-semibold text-aviation-primary hover:bg-aviation-light sm:h-9">
                      Customise
                    </button>
                  )}
                  <button type="button" onClick={() => save({ analytics: false, advertising: false })} className="h-10 rounded-md border border-aviation-border bg-white px-4 text-sm font-semibold text-aviation-dark hover:border-aviation-primary sm:h-9">
                    Reject non-essential
                  </button>
                  <button type="button" onClick={() => save({ analytics: true, advertising: true })} className="h-10 rounded-md bg-aviation-primary px-4 text-sm font-semibold text-white hover:opacity-90 sm:h-9">
                    Accept all
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
