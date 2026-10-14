import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { FaFacebookF, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { SITE } from "@/lib/site-config";

const LINK_COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { label: "Browse Parts", href: "/marketplace" },
      { label: "Suppliers", href: "/suppliers" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Buyers",
    links: [
      { label: "Register", href: "/register?type=buyer" },
      { label: "Dashboard", href: "/buyer/dashboard" },
      { label: "Request a Quote", href: "/buyer/rfqs/new" },
    ],
  },
  {
    title: "Suppliers",
    links: [
      { label: "Become a Supplier", href: "/register?type=supplier" },
      { label: "Supplier Dashboard", href: "/supplier/dashboard" },
      { label: "Membership", href: "/pricing" },
      { label: "Help Centre", href: "/contact" },
    ],
  },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
];

const SOCIAL_LINKS = [
  { label: "LinkedIn", href: SITE.social.linkedin, Icon: FaLinkedinIn },
  { label: "Facebook", href: SITE.social.facebook, Icon: FaFacebookF },
  { label: "X (Twitter)", href: SITE.social.x, Icon: FaXTwitter },
].filter((link) => link.href);

export default function Footer() {
  return (
    <footer className="bg-aviation-primary text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 lg:grid-cols-5">
        <div>
          <h3 className="mb-5 text-2xl font-bold">{SITE.name}</h3>
          <p className="text-sm leading-7 text-aviation-muted">
            The Global Aviation Marketplace connecting airlines, operators, MROs, aircraft owners and aviation
            suppliers worldwide.
          </p>
        </div>

        {LINK_COLUMNS.map((column) => (
          <div key={column.title}>
            <h4 className="mb-5 text-lg font-semibold">{column.title}</h4>
            <ul className="space-y-3 text-aviation-muted">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="mb-5 text-lg font-semibold">Contact</h4>
          <div className="space-y-4 text-aviation-muted">
            <a href={`mailto:${SITE.email}`} className="flex items-center gap-3 hover:text-white">
              <Mail size={18} aria-hidden="true" />
              {SITE.email}
            </a>
            <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 hover:text-white">
              <Phone size={18} aria-hidden="true" />
              {SITE.phone}
            </a>
            <div className="flex items-start gap-3">
              <MapPin size={18} aria-hidden="true" className="mt-1 shrink-0" />
              <address className="not-italic leading-6">
                {SITE.address.building}
                <br />
                {SITE.address.street}
                <br />
                {SITE.address.landmark}, {SITE.address.city}
              </address>
            </div>

            {SOCIAL_LINKS.length > 0 && (
              <div className="flex gap-4 pt-4">
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="rounded-full bg-white/10 p-2 transition hover:bg-white hover:text-aviation-primary"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-aviation-muted md:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
