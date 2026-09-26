import type { Metadata } from "next";
import PartDetails from "@/components/marketplace/PartDetails";
import { getPublicMarketplacePartById } from "@/lib/marketplace-server";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const part = await getPublicMarketplacePartById(id);

  if (!part) {
    return {
      title: "Aircraft Part Not Found | AviaInventory",
      description: "The requested aircraft part listing could not be found.",
    };
  }

  const title = `${part.part_number}${part.description ? ` – ${part.description}` : ""} | AviaInventory`;
  const description = `${part.part_number}${part.manufacturer ? ` by ${part.manufacturer}` : ""}. Available from ${part.supplier_name}. ${part.condition || "Published"} aircraft part listing on AviaInventory.`;

  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical: `/marketplace/${part.id}` },
    openGraph: {
      title,
      description: description.slice(0, 160),
      type: "website",
      images: part.image_urls?.[0] ? [{ url: part.image_urls[0], alt: part.part_number }] : undefined,
    },
  };
}

export default async function PartPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-7xl p-8">
      <PartDetails partId={id} />
    </main>
  );
}
