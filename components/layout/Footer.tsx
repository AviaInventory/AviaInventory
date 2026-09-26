import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { FaFacebookF, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="bg-aviation-primary text-white">
      {/* Top Section */}
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 lg:grid-cols-5">
        {/* Company */}
        <div>
          <h3 className="mb-5 text-2xl font-bold">AviaInventory</h3>

          <p className="text-sm leading-7 text-aviation-muted">
            The Global Aviation Marketplace connecting airlines, operators,
            MROs, aircraft owners and aviation suppliers worldwide.
          </p>
        </div>

        {/* Marketplace */}
        <div>
          <h4 className="mb-5 text-lg font-semibold">Marketplace</h4>

          <ul className="space-y-3 text-aviation-muted">
            <li>
              <Link href="/marketplace" className="hover:text-white">
                Browse Parts
              </Link>
            </li>

            <li>
              <Link href="/marketplace" className="hover:text-white">
                Categories
              </Link>
            </li>

            <li>
              <Link href="/marketplace" className="hover:text-white">
                Suppliers
              </Link>
            </li>

            <li>
              <Link href="/marketplace" className="hover:text-white">
                Advanced Search
              </Link>
            </li>
          </ul>
        </div>

        {/* Buyers */}
        <div>
          <h4 className="mb-5 text-lg font-semibold">Buyers</h4>

          <ul className="space-y-3 text-aviation-muted">
            <li>
              <Link
                href="/register?type=buyer"
                className="hover:text-white"
              >
                Register
              </Link>
            </li>

            <li>
              <Link href="/buyer/dashboard" className="hover:text-white">
                Dashboard
              </Link>
            </li>

            <li>
              <Link href="/buyer/rfqs/new" className="hover:text-white">
                Request a Quote
              </Link>
            </li>

            <li>
              <Link href="/buyer/dashboard" className="hover:text-white">
                Saved Parts
              </Link>
            </li>
          </ul>
        </div>

        {/* Suppliers */}
        <div>
          <h4 className="mb-5 text-lg font-semibold">Suppliers</h4>

          <ul className="space-y-3 text-aviation-muted">
            <li>
              <Link
                href="/register?type=supplier"
                className="hover:text-white"
              >
                Become a Supplier
              </Link>
            </li>

            <li>
              <Link href="/supplier/dashboard" className="hover:text-white">
                Supplier Dashboard
              </Link>
            </li>

            <li>
              <Link href="/supplier/dashboard" className="hover:text-white">
                Membership
              </Link>
            </li>

            <li>
              <Link href="/supplier/messages" className="hover:text-white">
                Help Centre
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="mb-5 text-lg font-semibold">Contact</h4>

          <div className="space-y-4 text-aviation-muted">
            <div className="flex items-center gap-3">
              <Mail size={18} />
              <span>info@aviainventory.com</span>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={18} />
              <span>+254 718 515 098</span>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={18} />
              <span>Nairobi, Kenya</span>
            </div>

            <div className="flex gap-4 pt-4">
              <Link
                href="https://linkedin.com"
                target="_blank"
                className="rounded-full bg-white/10 p-2 transition hover:bg-white hover:text-aviation-primary"
              >
                <FaLinkedinIn size={18} />
              </Link>

              <Link
                href="https://facebook.com"
                target="_blank"
                className="rounded-full bg-white/10 p-2 transition hover:bg-white hover:text-aviation-primary"
              >
                <FaFacebookF size={18} />
              </Link>

              <Link
                href="https://x.com"
                target="_blank"
                className="rounded-full bg-white/10 p-2 transition hover:bg-white hover:text-aviation-primary"
              >
                <FaXTwitter size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-aviation-muted md:flex-row">
          <p>
            © {new Date().getFullYear()} AviaInventory. All rights reserved.
          </p>

          <div className="flex gap-6">
            <Link href="/register" className="hover:text-white">
              Privacy Policy
            </Link>

            <Link href="/register" className="hover:text-white">
              Terms & Conditions
            </Link>

            <Link href="/register" className="hover:text-white">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}