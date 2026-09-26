import Link from "next/link";
import { FileCheck2, ShieldCheck } from "lucide-react";
import { getAdminListingCertificationDocuments } from "@/lib/admin-certification";
import ListingCertificationReviewTable from "@/components/admin/ListingCertificationReviewTable";

export default async function ListingCertificationsAdminPage() {
  const documents = await getAdminListingCertificationDocuments();
  const pending = documents.filter((doc) => doc.review_status !== "Reviewed" || doc.verification_status === "Not verified").length;

  return (
    <main className="min-h-screen bg-aviation-success-soft p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-aviation-success-soft text-aviation-primary"><FileCheck2 size={25}/></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-aviation-primary">Platform compliance</p>
                <h1 className="mt-1 text-3xl font-bold text-aviation-dark">Listing certification review</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-aviation-muted">Review evidence attached to individual listings. This queue does not change supplier-level verification.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-aviation-warning/30 bg-aviation-warning-soft px-3 py-2 text-xs font-bold text-aviation-warning">{pending} requiring attention</span>
              <Link href="/admin/dashboard" className="rounded-xl border border-aviation-border px-4 py-2.5 text-sm font-semibold text-aviation-dark hover:bg-aviation-light">Back to dashboard</Link>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-aviation-primary/15 bg-white p-4 text-sm text-aviation-muted sm:p-5">
          <div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-aviation-primary" size={18}/><div><p className="font-bold text-aviation-dark">Four independent states</p><p className="mt-1 leading-6">The supplier declares the document type. Upload status records the technical file transfer. Review status records the platform review. Verification status records the platform decision. A supplier cannot create the Verified state.</p></div></div>
        </section>

        <ListingCertificationReviewTable initialDocuments={documents} />
      </div>
    </main>
  );
}
