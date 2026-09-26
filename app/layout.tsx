import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";

import "./globals.css";
import SiteChrome from "@/components/layout/SiteChrome";

// Fonts are intentionally defined in CSS rather than through next/font/google.
// This keeps the project buildable in offline/restricted environments and avoids
// Next.js font-loader failures when Google font weights cannot be resolved.

export const metadata: Metadata = {
  title: "AviaInventory",
  description:
    "The Global Aviation Marketplace connecting buyers and suppliers worldwide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
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
