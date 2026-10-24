import Hero from "@/components/home/Hero";
import PromotedListings from "@/components/home/PromotedListings";
import Stats from "@/components/home/Stats";
import RecentlyAddedParts from "@/components/home/RecentlyAddedParts";
import SupplierSpotlight from "@/components/home/SupplierSpotlight";
import HowItWorks from "@/components/home/HowItWorks";
import CallToAction from "@/components/home/CallToAction";
import Footer from "@/components/layout/Footer";
import { getPromotedListings, getSupplierDirectory } from "@/lib/homepage-data";

// Rebuild at most every 60 s (like /marketplace and /suppliers). Without this the page was
// generated once at deploy time and new suppliers/listings never appeared on it.
export const revalidate = 60;

export default async function Home() {
  const [promotedListings, featuredSuppliers] = await Promise.all([
    getPromotedListings(8),
    getSupplierDirectory(4),
  ]);

  return (
    <main className="min-h-screen bg-aviation-light">
      {/* Hero Section */}
      <Hero />

      {/* Featured / promoted parts, services and products */}
      <PromotedListings listings={promotedListings} />

      {/* Featured / promoted suppliers and MROs */}
      <SupplierSpotlight suppliers={featuredSuppliers} />

      {/* Recently Added Aircraft Parts */}
      <RecentlyAddedParts />

      {/* Live Marketplace Statistics */}
      <Stats />

      {/* The Procurement Path: buy, sell & service, and the account switch */}
      <HowItWorks />

      {/* Call to Action + Book a Demo */}
      <CallToAction />

      {/* Footer */}
      <Footer />
    </main>
  );
}
