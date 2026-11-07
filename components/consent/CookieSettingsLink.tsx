"use client";

import { openCookieSettings } from "@/lib/consent";

/** Footer link that reopens the cookie consent choices. */
export default function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      Cookie settings
    </button>
  );
}
