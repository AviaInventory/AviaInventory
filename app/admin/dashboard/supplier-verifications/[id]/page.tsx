import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, History } from "lucide-react";
import VerificationStatusBadge from "@/components/supplier/verification/VerificationStatusBadge";
import SupplierDocumentReview from "@/components/admin/SupplierDocumentReview";
import SupplierVerificationDecision from "@/components/admin/SupplierVerificationDecision";
import { getSupplierVerificationDetail } from "@/lib/admin-supplier-verification";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ id: string }> };

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

function expiryNote(expiry: string | null) {
  if (!expiry) return null;
  const days = Math.floor((new Date(`${expiry}T00:00:00Z`).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { text: `Expired ${-days} days ago`, tone: "text-aviation-error" };
  if (days <= 30) return { text: `Expires in ${days} days`, tone: "text-aviation-error" };
  if (days <= 90) return { text: `Expires in ${days} days`, tone: "text-aviation-warning" };
  return { text: `Valid until ${formatDate(expiry)}`, tone: "text-[var(--aviation-muted)]" };
}

export default async function SupplierVerificationReviewPage({ params }: Props) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const detail = await getSupplierVerificationDetail(id);
  if (!detail) notFound();

  const { supplier, profile, documents, events, checks, completion } = detail;
  const facts: [string, string | null | undefined][] = [
    ["Business type", supplier.business_type],
    ["Address", [supplier.address, supplier.city, profile?.country].filter(Boolean).join(", ")],
    ["Website", supplier.website],
    ["Registration no.", supplier.registration_number || profile?.registration_number],
    ["Contact", [profile?.full_name, profile?.job_title].filter(Boolean).join(", ")],
    ["Email", profile?.email],
    ["Phone", profile?.phone],
    ["Categories", (supplier.supplier_categories ?? []).join(", ")],
    ["Registered", formatDate(profile?.created_at)],
  ];

  return (
    <main className="min-h-screen bg-aviation-light p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link href="/admin/dashboard/supplier-verifications" className="inline-flex items-center gap-2 text-sm font-semibold text-aviation-primary hover:underline">
          <ArrowLeft size={16} aria-hidden="true" /> Supplier verification queue
        </Link>

        <header className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-aviation-primary">Supplier verification</p>
            <h1 className="mt-1 text-3xl font-bold text-aviation-dark">{supplier.company_name || "Unnamed supplier"}</h1>
            <p className="mt-2 text-sm text-[var(--aviation-muted)]">
              Submitted {formatDate(supplier.verification_submitted_at)} · Last reviewed {formatDate(supplier.verification_reviewed_at)}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 lg:items-end">
            <VerificationStatusBadge status={supplier.verification_status || "Draft"} />
            <p className="text-sm font-semibold tabular-nums">Readiness {completion}%</p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-6">
            <section className="rounded-2xl border border-aviation-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-aviation-dark">Readiness checklist</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {checks.map((check) => (
                  <li key={check.key} className="flex gap-3 rounded-xl border border-aviation-border p-3">
                    {check.complete ? (
                      <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-aviation-success" aria-label="Met" />
                    ) : (
                      <Circle size={19} className="mt-0.5 shrink-0 text-[var(--aviation-muted)]" aria-label="Not met" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-aviation-dark">{check.label}</p>
                      <p className="text-xs text-[var(--aviation-muted)]">{check.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-aviation-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-aviation-dark">Documents ({documents.length})</h2>
              {documents.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--aviation-muted)]">The supplier has not uploaded any documents yet.</p>
              ) : (
                <ul className="mt-4 divide-y divide-aviation-border">
                  {documents.map((doc) => {
                    const expiry = expiryNote(doc.expiry_date);
                    return (
                      <li key={doc.id} className="py-5 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-aviation-dark">{doc.document_name}</p>
                            <p className="text-sm text-[var(--aviation-muted)]">
                              {doc.document_type}
                              {doc.issuing_authority ? ` · ${doc.issuing_authority}` : ""} · v{doc.version}
                            </p>
                            <p className="mt-1 text-xs text-[var(--aviation-muted)]">
                              Issued {formatDate(doc.issue_date)}
                              {expiry && <span className={`ml-2 font-semibold ${expiry.tone}`}>{expiry.text}</span>}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="rounded-full bg-aviation-light px-3 py-1 text-xs font-semibold">{doc.verification_status}</span>
                            {doc.reviewed_at && (
                              <p className="mt-1 text-xs text-[var(--aviation-muted)]">
                                {doc.reviewed_by_admin} · {formatDate(doc.reviewed_at)}
                              </p>
                            )}
                          </div>
                        </div>
                        <SupplierDocumentReview documentId={doc.id} currentStatus={doc.verification_status} currentNotes={doc.reviewer_notes} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-aviation-border bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold text-aviation-dark">
                <History size={18} aria-hidden="true" /> Review history
              </h2>
              {events.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--aviation-muted)]">No review actions yet.</p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {events.map((event) => {
                    const doc = event.document_id ? documents.find((item) => item.id === event.document_id) : null;
                    return (
                      <li key={event.id} className="rounded-xl bg-aviation-light p-3 text-sm">
                        <p className="font-semibold text-aviation-dark">
                          {event.subject === "supplier" ? "Supplier" : `Document${doc ? ` "${doc.document_name}"` : ""}`}: {event.from_status ?? "—"} → {event.to_status}
                        </p>
                        <p className="text-xs text-[var(--aviation-muted)]">
                          {event.actor_admin} · {new Date(event.created_at).toLocaleString("en-GB")}
                        </p>
                        {event.comments && <p className="mt-1 whitespace-pre-line text-[var(--aviation-muted)]">{event.comments}</p>}
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-aviation-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-aviation-dark">Company</h2>
              <dl className="mt-4 space-y-3 text-sm">
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--aviation-muted)]">{label}</dt>
                    <dd className="mt-0.5 break-words text-aviation-dark">{value || "—"}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-2xl border border-aviation-border bg-white p-6 shadow-sm lg:sticky lg:top-6">
              <h2 className="mb-4 text-lg font-bold text-aviation-dark">Verification decision</h2>
              <SupplierVerificationDecision
                supplierId={supplier.id}
                currentStatus={supplier.verification_status || "Draft"}
                currentComments={supplier.verification_comments}
                currentMissing={supplier.verification_missing_information ?? []}
                suggestedMissing={checks.filter((check) => !check.complete).map((check) => `${check.label}: ${check.detail}`)}
              />
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
