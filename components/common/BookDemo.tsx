"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useSessionProfile } from "@/components/layout/useSessionProfile";
import { DEMO_EMAIL, demoLinks } from "@/lib/site-config";

/**
 * Two ways to request a demo: WhatsApp chat or a pre-filled email to the sales team.
 * Signed-in users get their name, company and email filled in from their profile;
 * visitors get the blank template.
 */
export default function BookDemoOptions({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  const profile = useSessionProfile();
  // The profile name falls back to the email or "My account" when no full name is saved.
  const realName = profile && profile.name !== profile.email && profile.name !== "My account" ? profile.name : null;
  const links = demoLinks(profile ? { name: realName, company: profile.company, email: profile.email } : null);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <a
        href={links.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1fa855] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#178a45]"
      >
        <MessageCircle size={19} aria-hidden="true" />
        Book via WhatsApp
      </a>
      <a
        href={links.mailto}
        className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold ${
          dark ? "border border-white/30 bg-white/10 text-white hover:bg-white/20" : "border border-aviation-border bg-white text-aviation-dark hover:border-aviation-primary hover:text-aviation-primary"
        }`}
        title={DEMO_EMAIL}
      >
        <Mail size={19} aria-hidden="true" />
        Book via email
      </a>
    </div>
  );
}
