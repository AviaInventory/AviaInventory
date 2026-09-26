import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administrator Login | AviaInventory",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function PlatformConsoleLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
