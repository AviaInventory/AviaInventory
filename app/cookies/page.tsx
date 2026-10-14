import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { SITE } from "@/lib/site-config";

// DRAFT WORDING: must be reviewed and approved by Upgear Aviation before going live.
// Keep the table in sync with what the site actually stores (see lib/supabase, lib/admin-auth,
// RegistrationWizard and AddPartForm drafts).

export const metadata: Metadata = {
  title: "Cookie Policy | AviaInventory",
  description: "The cookies and browser storage AviaInventory uses, why, and how to control them.",
};

const link = "text-aviation-primary underline";

const STORAGE_ITEMS = [
  {
    name: "sb-…-auth-token",
    type: "Cookie (essential)",
    purpose: "Keeps you signed in and secures your session. Set by our authentication provider, Supabase.",
    duration: "Until you sign out, or the session expires",
  },
  {
    name: "aviainventory_admin",
    type: "Cookie (essential)",
    purpose: "Signs AviaInventory staff in to the platform console. Not set for buyers or suppliers.",
    duration: "8 hours",
  },
  {
    name: "aviainventory_onboarding_draft_v2",
    type: "Browser storage (functional)",
    purpose: "Saves your unfinished registration answers so you can continue later. Passwords are never saved.",
    duration: "Until you finish registering or clear your browser data",
  },
  {
    name: "Listing draft",
    type: "Browser storage (functional)",
    purpose: "Saves an unfinished parts listing on the supplier's own device.",
    duration: "Until the listing is saved or you clear your browser data",
  },
];

const sections: LegalSection[] = [
  {
    id: "what",
    heading: "What cookies and browser storage are",
    body: (
      <p>
        Cookies are small text files a website stores in your browser. Browser storage (local storage) works in a similar way
        but stays on your device and is never sent to our servers automatically. We use both only where they are needed for
        the site to work.
      </p>
    ),
  },
  {
    id: "list",
    heading: "What we use",
    body: (
      <>
        <div className="overflow-x-auto rounded-xl border border-aviation-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-aviation-light">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Purpose</th>
                <th className="px-4 py-3 font-semibold">How long</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aviation-border">
              {STORAGE_ITEMS.map((item) => (
                <tr key={item.name} className="align-top">
                  <td className="px-4 py-3 font-mono text-xs">{item.name}</td>
                  <td className="px-4 py-3">{item.type}</td>
                  <td className="px-4 py-3">{item.purpose}</td>
                  <td className="px-4 py-3">{item.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          We do <strong>not</strong> use advertising, tracking or third-party analytics cookies, and we do not sell or share
          cookie data.
        </p>
        <p>
          When you pay for a subscription you are taken to Paystack&apos;s secure checkout. Paystack may set its own cookies on
          its pages to process the payment and prevent fraud; these are covered by Paystack&apos;s cookie and privacy policies.
        </p>
      </>
    ),
  },
  {
    id: "consent",
    heading: "Consent and the law",
    body: (
      <p>
        Essential cookies are needed to provide the service you ask for, so they do not require consent. If we ever introduce
        analytics or marketing cookies, we will ask for your consent first, as the Data Protection Act, 2019 and its
        regulations require, and update this policy.
      </p>
    ),
  },
  {
    id: "control",
    heading: "How to control cookies",
    body: (
      <>
        <p>
          You can delete or block cookies and browser storage in your browser settings. If you block essential cookies you will
          not be able to sign in. Clearing browser storage deletes any unsaved registration or listing drafts.
        </p>
        <p>
          Signing out of {SITE.name} removes the sign-in cookie from your browser.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    heading: "Changes and contact",
    body: (
      <p>
        We will update this page if the cookies we use change. Questions: <a className={link} href={`mailto:${SITE.emails.general}`}>{SITE.emails.general}</a>.
        For how we handle personal data generally, see our <Link className={link} href="/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      intro={<p>This policy explains the cookies and browser storage {SITE.name} uses, why, and how you can control them.</p>}
      sections={sections}
    />
  );
}
