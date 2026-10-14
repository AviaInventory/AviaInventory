import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Footer from "@/components/layout/Footer";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact & Help | AviaInventory",
  description: "Contact the AviaInventory team for help with your account, listings, RFQs, billing or subscriptions.",
};

const tel = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;
const whatsapp = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

const TEAMS = [
  { team: "Technical support", detail: "Signing in, account settings, listings, RFQs and bugs", email: SITE.emails.support },
  { team: "Billing & subscriptions", detail: "Plans, payments, invoices and receipts", email: SITE.emails.billing },
  { team: "Sales & promotions", detail: "Featured listings, promotions and advertising", email: SITE.emails.sales },
  { team: "General enquiries", detail: "Partnerships, privacy requests and everything else", email: SITE.emails.general },
];

const SELF_SERVICE = [
  { question: "I forgot my password", href: "/forgot-password", action: "Reset your password" },
  { question: "I want to sell parts", href: "/register?type=supplier", action: "Create a Buyer & Supplier account" },
  { question: "What do the plans cost?", href: "/pricing", action: "See pricing" },
];

export default function ContactPage() {
  return (
    <>
      <main className="min-h-screen bg-aviation-light py-10 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-aviation-accent">Help centre</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-aviation-dark sm:text-4xl">Contact {SITE.name}</h1>
          <p className="mt-3 max-w-2xl text-[var(--aviation-muted)]">
            Questions about your account, a listing, an RFQ or your subscription? Reach the right team below.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-aviation-border bg-white p-5 shadow-sm">
              <Phone className="text-aviation-primary" size={22} aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[var(--aviation-muted)]">Phone</p>
              <a href={tel(SITE.phone)} className="mt-1 block font-semibold text-aviation-primary hover:underline">{SITE.phone}</a>
            </div>
            <div className="rounded-2xl border border-aviation-border bg-white p-5 shadow-sm">
              <MessageCircle className="text-aviation-primary" size={22} aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[var(--aviation-muted)]">WhatsApp</p>
              <a href={whatsapp(SITE.phone)} target="_blank" rel="noopener noreferrer" className="mt-1 block font-semibold text-aviation-primary hover:underline">
                Chat with us
              </a>
            </div>
            <div className="rounded-2xl border border-aviation-border bg-white p-5 shadow-sm">
              <MapPin className="text-aviation-primary" size={22} aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[var(--aviation-muted)]">Office</p>
              <address className="mt-1 text-sm not-italic leading-6 text-aviation-dark">
                {SITE.address.building}
                <br />
                {SITE.address.street}
                <br />
                {SITE.address.landmark}, {SITE.address.city}
              </address>
            </div>
          </div>

          <section className="mt-10 rounded-2xl border border-aviation-border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-aviation-primary">Email the right team</h2>
            <ul className="mt-4 divide-y divide-aviation-border">
              {TEAMS.map((item) => (
                <li key={item.email} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-aviation-dark">{item.team}</p>
                    <p className="text-sm text-[var(--aviation-muted)]">{item.detail}</p>
                  </div>
                  <a href={`mailto:${item.email}`} className="inline-flex items-center gap-2 text-sm font-semibold text-aviation-primary hover:underline">
                    <Mail size={16} aria-hidden="true" />
                    {item.email}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6 rounded-2xl border border-aviation-border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-aviation-primary">Quick answers</h2>
            <ul className="mt-4 divide-y divide-aviation-border">
              {SELF_SERVICE.map((item) => (
                <li key={item.href} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-aviation-dark">{item.question}</span>
                  <Link href={item.href} className="text-sm font-semibold text-aviation-primary hover:underline">
                    {item.action}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
