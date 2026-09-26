import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2, Globe, MapPin, Package, Star, Tags } from "lucide-react";
import { getPublicSupplierProfile } from "@/lib/homepage-data";
import VerificationStatusBadge from "@/components/supplier/verification/VerificationStatusBadge";

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getPublicSupplierProfile(id).catch(() => null);
  const name = data?.supplier?.company_name || "Supplier";
  return {
    title: `${name} | AviaInventory Supplier` ,
    description: `View ${name}'s aviation parts inventory, supplier credentials and buyer reviews.`,
    alternates: { canonical: `/suppliers/${id}` },
  };
}

export default async function PublicSupplierProfile({ params }: Props) {
  const { id } = await params;
  const data = await getPublicSupplierProfile(id);

  if (!data) {
    return <main className="min-h-screen bg-aviation-light p-8"><div className="mx-auto max-w-4xl rounded-2xl bg-white p-10 text-center"><h1 className="text-2xl font-bold text-aviation-dark">Supplier not found</h1><Link href="/" className="mt-5 inline-flex font-semibold text-aviation-primary">Return home</Link></div></main>;
  }

  const { supplier, reviews, rating, reviewCount, listingCount } = data;

  return (
    <main className="min-h-screen bg-aviation-light py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-aviation-primary hover:underline"><ArrowLeft size={16} /> Back to AviaInventory</Link>

        <section className="mt-6 rounded-[var(--aviation-radius-xl)] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-aviation-primary text-white"><Building2 size={34} /></div>
              <div>
                <div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-bold text-aviation-dark sm:text-4xl">{supplier.company_name || "Verified Supplier"}</h1><VerificationStatusBadge status={supplier.verification_status || "Draft"} compact /></div>
                <p className="mt-2 text-aviation-muted">{supplier.business_type || "Aviation supplier"}</p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-aviation-muted">
                  {supplier.country && <span className="inline-flex items-center gap-2"><MapPin size={15} />{supplier.city ? `${supplier.city}, ${supplier.country}` : supplier.country}</span>}
                  {supplier.website && <a href={supplier.website.startsWith("http") ? supplier.website : `https://${supplier.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-aviation-primary hover:underline"><Globe size={15} />Website</a>}
                </div>
              </div>
            </div>
            <Link href="/marketplace" className="inline-flex items-center justify-center gap-2 rounded-xl bg-aviation-accent px-5 py-3 font-semibold text-white"><Package size={17} /> Browse listings</Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-aviation-border bg-aviation-light p-4"><p className="text-xs uppercase tracking-wider text-aviation-muted">Active listings</p><p className="mt-1 text-2xl font-bold text-aviation-primary">{listingCount.toLocaleString()}</p></div>
            <Link href="#reviews" className="rounded-xl border border-aviation-border bg-aviation-light p-4 hover:border-aviation-primary/40"><p className="text-xs uppercase tracking-wider text-aviation-muted">Buyer rating</p><p className="mt-1 flex items-center gap-2 text-2xl font-bold text-aviation-primary"><Star size={20} className="fill-aviation-accent text-aviation-accent" />{rating == null ? "New" : rating.toFixed(1)} <span className="text-sm font-medium text-aviation-muted">({reviewCount} {reviewCount === 1 ? "review" : "reviews"})</span></p></Link>
            <div className="rounded-xl border border-aviation-border bg-aviation-light p-4"><p className="text-xs uppercase tracking-wider text-aviation-muted">Categories</p><p className="mt-1 text-2xl font-bold text-aviation-primary">{supplier.supplier_categories?.length ?? 0}</p></div>
          </div>
        </section>

        <section className="mt-6 rounded-[var(--aviation-radius-xl)] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3"><Tags size={20} className="text-aviation-primary" /><h2 className="text-xl font-bold text-aviation-primary">Supplier categories</h2></div>
          <div className="mt-4 flex flex-wrap gap-2">{(supplier.supplier_categories ?? []).length ? supplier.supplier_categories.map((category: string) => <span key={category} className="rounded-full bg-aviation-success-soft px-3 py-1.5 text-sm font-medium text-aviation-primary">{category}</span>) : <span className="text-sm text-aviation-muted">No categories listed.</span>}</div>
        </section>

        <section id="reviews" className="mt-6 scroll-mt-6 rounded-[var(--aviation-radius-xl)] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-aviation-accent">Buyer feedback</p><h2 className="mt-1 text-2xl font-bold text-aviation-primary">Reviews</h2></div><div className="flex items-center gap-2 text-sm text-aviation-muted"><Star size={17} className="fill-aviation-accent text-aviation-accent" /><strong className="text-aviation-dark">{rating == null ? "No rating yet" : rating.toFixed(1)}</strong> ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})</div></div>
          {reviews.length === 0 ? <div className="mt-6 rounded-xl border border-dashed border-aviation-border p-8 text-center text-sm text-aviation-muted">This supplier has not received any published buyer reviews yet.</div> : <div className="mt-6 divide-y divide-aviation-border">{reviews.map((review) => <article key={review.id} className="py-6 first:pt-0 last:pb-0"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-1">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={15} className={i < review.rating ? "fill-aviation-accent text-aviation-accent" : "text-aviation-border"} />)}</div><p className="mt-2 text-sm font-semibold text-aviation-dark">{review.title || "Buyer review"}</p></div><div className="text-right text-xs text-aviation-muted"><p>{review.reviewer_name}</p><time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString()}</time></div></div>{review.comment && <p className="mt-3 max-w-3xl text-sm leading-6 text-aviation-muted">{review.comment}</p>}</article>)}</div>}
        </section>
      </div>
    </main>
  );
}
