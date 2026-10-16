import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";

import "./globals.css";
import SiteChrome from "@/components/layout/SiteChrome";

// Fonts are intentionally defined in CSS rather than through next/font/google.
// This keeps the project buildable in offline/restricted environments and avoids
// Next.js font-loader failures when Google font weights cannot be resolved.

export const metadata: Metadata = {
  metadataBase: new URL("https://www.aviainventory.com"),
  title: {
    default: "AviaInventory | Aircraft Parts Marketplace",
    template: "%s",
  },
  description:
    "AviaInventory is an aircraft parts marketplace connecting airlines, MROs and operators with verified aviation suppliers. Search parts, request quotes and compare offers. Based in Nairobi, Kenya.",
  applicationName: "AviaInventory",
  keywords: ["AviaInventory", "Avia Inventory", "aircraft parts", "aviation parts marketplace", "aircraft spares Kenya", "RFQ aircraft parts", "MRO parts"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "AviaInventory",
    url: "https://www.aviainventory.com",
    title: "AviaInventory | Aircraft Parts Marketplace",
    description: "Search aircraft parts, request quotes and compare offers from verified aviation suppliers.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="min-h-screen bg-aviation-light flex flex-col">
        <SiteChrome>{children}</SiteChrome>
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "var(--aviation-radius-md)",
              background: "var(--aviation-dark)",
              color: "var(--aviation-white)",
              fontFamily: "var(--font-body)",
            },
          }}
        />
      </body>
    </html>
  );
}
