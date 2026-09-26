import Hero from "@/components/home/Hero";
import BrowseCategories from "@/components/home/BrowseCategories";
import Stats from "@/components/home/Stats";
import RecentlyAddedParts from "@/components/home/RecentlyAddedParts";
import SupplierSpotlight from "@/components/home/SupplierSpotlight";
import HowItWorks from "@/components/home/HowItWorks";
import CallToAction from "@/components/home/CallToAction";
import Footer from "@/components/layout/Footer";
import { getHomepageCategoryCounts, getHomepageSupplierSummaries } from "@/lib/homepage-data";

export default async function Home() {
  const [categoryCounts, supplierSummaries] = await Promise.all([
    getHomepageCategoryCounts(),
    getHomepageSupplierSummaries(4),
  ]);

  return (
    <main className="min-h-screen bg-aviation-light">
      {/* Hero Section */}
      <Hero />

      {/* Browse Parts by Category */}
      <BrowseCategories counts={categoryCounts} />

      {/* Live Marketplace Statistics */}
      <Stats />

      {/* Recently Added Aircraft Parts */}
      <RecentlyAddedParts />

      {/* Featured Suppliers */}
      <SupplierSpotlight suppliers={supplierSummaries} />

      {/* How AviaInventory Works */}
      <HowItWorks />

      {/* Call to Action */}
      <CallToAction />

      {/* Footer */}
      <Footer />
    </main>
  );
}