import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Clock, FileText, Info, MessageSquareQuote, Minus, ShieldCheck, Users, Wrench } from "lucide-react";
import { requireRole } from "@/lib/auth-guard";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { createClient } from "@/lib/supabase/server";
import ExportIntelligenceCsv from "@/components/supplier/intelligence/ExportIntelligenceCsv";
import {
  INTELLIGENCE_PERIODS,
  formatFileSize,
  formatHours,
  getMarketIntelligence,
  getPublishedReports,
  parsePeriod,
  type MarketIntelligence,
} from "@/lib/market-intelligence";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ days?: string }> };

const muted = "text-[var(--aviation-muted)]";
const card = "rounded-2xl border border-aviation-border bg-white p-5 sm:p-6";

function SectionHeading({ title, text }: { title: string; text?: string }) {
  return <div className="mb-4"><h2 className="text-lg font-bold text-aviation-dark">{title}</h2>{text && <p className={`mt-0.5 text-xs leading-5 ${muted}`}>{text}</p>}</div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className={`rounded-xl border border-dashed border-aviation-border px-4 py-6 text-center text-sm ${muted}`}>{children}</p>;
}

/** Change against the previous period, with an arrow and words, never colour alone. */
function Trend({ current, previous }: { current: number; previous: number }) {
  if (!previous) return current ? <span className={`text-xs ${muted}`}>New this period</span> : null;
  const pct = Math.round(((current - previous) / previous) * 100);
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  return <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${pct > 0 ? "text-aviation-success" : pct < 0 ? "text-aviation-error" : muted}`}><Icon size={13} aria-hidden="true" />{pct > 0 ? "+" : ""}{pct}% vs previous period</span>;
}

function StatTile({ label, value, note, icon: Icon }: { label: string; value: string; note?: React.ReactNode; icon: React.ElementType }) {
  return (
    <div className={card}>
      <p className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${muted}`}><Icon size={14} className="text-aviation-primary" aria-hidden="true" />{label}</p>
      <p className="mt-2 font-mono text-3xl font-bold text-aviation-dark">{value}</p>
      {note && <div className="mt-1 min-h-4">{note}</div>}
    </div>
  );
}

/** One-series horizontal bars: label, thin bar, value. The value is always written out. */
function BarList({ rows, unit = "RFQs" }: { rows: { label: string; value: number; note?: string }[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label} title={`${row.label}: ${row.value.toLocaleString()} ${unit}${row.note ? ` (${row.note})` : ""}`} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] items-center gap-3 rounded-md py-0.5 hover:bg-aviation-light sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto]">
          <span className="truncate text-sm text-aviation-dark">{row.label}</span>
          <span className="h-2 rounded-r bg-aviation-light" aria-hidden="true">
            <span className="block h-2 rounded-r bg-aviation-primary" style={{ width: `${Math.max(3, (row.value / max) * 100)}%` }} />
          </span>
          <span className="text-right font-mono text-sm font-semibold text-aviation-dark">{row.value.toLocaleString()}{row.note && <span className={`ml-1 font-sans text-xs font-normal ${muted}`}>{row.note}</span>}</span>
        </li>
      ))}
    </ul>
  );
}

const money = (value: number, currency: string) => `${currency} ${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

function Performance({ me }: { me: MarketIntelligence["my_performance"] }) {
  const responseRate = me.rfqs_available ? Math.round((me.rfqs_quoted / me.rfqs_available) * 100) : null;
  const winRate = me.quotes ? Math.round((me.quotes_won / me.quotes) * 100) : null;
  const faster = me.median_response_hours != null && me.market_median_response_hours != null ? me.median_response_hours <= me.market_median_response_hours : null;
  const items = [
    { label: "RFQs you quoted on", value: responseRate == null ? "—" : `${responseRate}%`, detail: `${me.rfqs_quoted.toLocaleString()} of ${me.rfqs_available.toLocaleString()} RFQs open to you` },
    { label: "Quotes won", value: winRate == null ? "—" : `${winRate}%`, detail: `${me.quotes_won.toLocaleString()} of ${me.quotes.toLocaleString()} quotes accepted` },
    { label: "Your response time", value: formatHours(me.median_response_hours), detail: me.market_median_response_hours == null ? "No market figure yet" : `Market median ${formatHours(me.market_median_response_hours)}${faster == null ? "" : faster ? " — you are as fast or faster" : " — you are slower"}` },
    {
      label: "Your price vs market",
      value: me.price_vs_median_pct == null ? "—" : `${me.price_vs_median_pct > 0 ? "+" : ""}${me.price_vs_median_pct}%`,
      detail: me.price_vs_median_pct == null ? "Shown once 3+ suppliers quote the same parts as you" : `Against the median quote, across ${me.price_compared_quotes} of your quotes`,
    },
  ];
  return (
    <section className={card}>
      <SectionHeading title="Your performance" text="How your quoting compares with the whole marketplace over the same period." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl bg-aviation-light p-4">
            <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>{item.label}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-aviation-dark">{item.value}</p>
            <p className={`mt-1 text-xs leading-5 ${muted}`}>{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function IntelligencePage({ searchParams }: Props) {
  await requireRole(["supplier"]);
  await requireActiveSubscription("aviation_intelligence");
  const days = parsePeriod((await searchParams).days);
  const supabase = await createClient();
  const [{ data, error }, reports] = await Promise.all([getMarketIntelligence(supabase, days), getPublishedReports(supabase)]);

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-aviation-accent">PLATINUM SERVICE</p>
          <h1 className="text-3xl font-bold text-aviation-dark">Aviation Market Intelligence</h1>
          <p className={`mt-2 max-w-3xl text-sm leading-6 ${muted}`}>
            Demand, pricing and response times from RFQs and quotes on AviaInventory. Figures are totals across the marketplace — no buyer or supplier is named.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Period" className="inline-flex rounded-lg border border-aviation-border bg-white p-0.5">
            {INTELLIGENCE_PERIODS.map((period) => (
              <Link key={period} href={`?days=${period}`} aria-current={period === days ? "page" : undefined} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${period === days ? "bg-aviation-primary text-white" : "text-aviation-dark hover:bg-aviation-light"}`}>
                {period === 365 ? "12 months" : `${period} days`}
              </Link>
            ))}
          </nav>
          {data && <ExportIntelligenceCsv data={data} />}
        </div>
      </header>

      {!data ? (
        <div className={card}><p className="font-semibold text-aviation-dark">Market data could not be loaded.</p><p className={`mt-1 text-sm ${muted}`}>{error?.includes("Platinum") ? "Aviation Market Intelligence is part of the Platinum plan." : "Please refresh the page in a moment."}</p></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile icon={FileText} label="RFQs" value={data.summary.rfqs.toLocaleString()} note={<Trend current={data.summary.rfqs} previous={data.summary.rfqs_previous} />} />
            <StatTile icon={MessageSquareQuote} label="Quotes per RFQ" value={data.summary.quotes_per_rfq == null ? "—" : data.summary.quotes_per_rfq.toLocaleString()} note={<span className={`text-xs ${muted}`}>{data.summary.quotes.toLocaleString()} quotes sent</span>} />
            <StatTile icon={Clock} label="Time to first quote" value={formatHours(data.summary.median_first_quote_hours)} note={<span className={`text-xs ${muted}`}>Median across RFQs</span>} />
            <StatTile icon={Users} label="Active buyers" value={data.summary.buyers == null ? "—" : data.summary.buyers.toLocaleString()} note={<span className={`text-xs ${muted}`}>{data.summary.buyers == null ? `Shown from ${data.min_companies} buyers` : `${data.summary.parts_rfqs} parts · ${data.summary.mro_rfqs} MRO RFQs`}</span>} />
          </div>

          <Performance me={data.my_performance} />

          <section className={card}>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <SectionHeading title="RFQs you can still quote on" text="Open RFQs you have not quoted yet, your own categories first." />
              <Link href="/supplier/rfqs" className="inline-flex items-center gap-1 text-sm font-semibold text-aviation-primary hover:underline">All RFQs <ArrowRight size={14} /></Link>
            </div>
            {data.opportunities.length === 0 ? <Empty>No open RFQs are waiting for your quote right now.</Empty> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead><tr className={`border-b border-aviation-border text-xs uppercase tracking-wide ${muted}`}><th className="py-2 pr-3 font-semibold">Part number</th><th className="py-2 pr-3 font-semibold">Category</th><th className="py-2 pr-3 text-right font-semibold">Qty</th><th className="py-2 pr-3 font-semibold">Needed by</th><th className="py-2 pr-3 text-right font-semibold">Quotes so far</th><th className="py-2" /></tr></thead>
                  <tbody className="divide-y divide-aviation-border">
                    {data.opportunities.map((rfq) => (
                      <tr key={rfq.id}>
                        <td className="py-2.5 pr-3 font-mono font-semibold text-aviation-dark">{rfq.part_number || "—"}{rfq.rfq_type === "mro" && <span className="ml-2 inline-flex items-center gap-1 rounded bg-[#e8f3f4] px-1.5 py-0.5 font-sans text-[11px] font-semibold text-[#0f5b6b]"><Wrench size={11} aria-hidden="true" />MRO</span>}</td>
                        <td className="py-2.5 pr-3">{rfq.category || "—"}{rfq.matches_category && <span className="ml-2 rounded bg-aviation-light px-1.5 py-0.5 text-[11px] font-semibold text-aviation-primary">Your category</span>}</td>
                        <td className="py-2.5 pr-3 text-right font-mono">{rfq.quantity ?? "—"}</td>
                        <td className="py-2.5 pr-3">{rfq.required_date ? new Date(`${rfq.required_date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</td>
                        <td className="py-2.5 pr-3 text-right font-mono">{rfq.quotes}</td>
                        <td className="py-2.5 text-right"><Link href={`/supplier/rfqs/${rfq.id}`} className="font-semibold text-aviation-primary hover:underline">Quote</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className={card}>
              <SectionHeading title="Most requested part numbers" text="Part numbers buyers sent RFQs for in this period." />
              {data.top_parts.length === 0 ? <Empty>Not enough market activity yet.</Empty> : (
                <BarList rows={data.top_parts.map((part) => ({ label: part.part_number, value: part.rfqs, note: part.category ?? undefined }))} />
              )}
            </section>
            <section className={card}>
              <SectionHeading title="Demand by category" text="RFQs per category, with the change from the previous period." />
              {data.categories.length === 0 ? <Empty>Not enough market activity yet.</Empty> : (
                <BarList rows={data.categories.map((c) => {
                  const change = c.rfqs_previous ? Math.round(((c.rfqs - c.rfqs_previous) / c.rfqs_previous) * 100) : null;
                  return { label: c.category, value: c.rfqs, note: change == null ? "new" : `${change > 0 ? "▲ +" : change < 0 ? "▼ " : ""}${change}%` };
                })} />
              )}
            </section>
            <section className={card}>
              <SectionHeading title="Where demand comes from" text={`Buyer country. Countries with fewer than ${data.min_companies} buyers are grouped together.`} />
              {data.countries.length === 0 ? <Empty>Not enough market activity yet.</Empty> : <BarList rows={data.countries.map((c) => ({ label: c.country, value: c.rfqs }))} />}
            </section>
            <section className={card}>
              <SectionHeading title="Repair / overhaul demand" text="MRO service RFQs by category." />
              {data.mro_demand.length === 0 ? <Empty>No MRO service RFQs in this period.</Empty> : <BarList rows={data.mro_demand.map((m) => ({ label: m.category, value: m.rfqs }))} />}
            </section>
          </div>

          <section className={card}>
            <SectionHeading title="Quoted price ranges" text={`Low, median and high quoted unit price per part number. Shown only where at least ${data.min_companies} suppliers quoted, so no single supplier's price can be worked out.`} />
            {data.price_ranges.length === 0 ? <Empty>No part number has quotes from {data.min_companies} or more suppliers in this period yet. Price ranges appear as quoting grows.</Empty> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead><tr className={`border-b border-aviation-border text-xs uppercase tracking-wide ${muted}`}><th className="py-2 pr-3 font-semibold">Part number</th><th className="py-2 pr-3 text-right font-semibold">Low</th><th className="py-2 pr-3 text-right font-semibold">Median</th><th className="py-2 pr-3 text-right font-semibold">High</th><th className="py-2 text-right font-semibold">Suppliers</th></tr></thead>
                  <tbody className="divide-y divide-aviation-border">
                    {data.price_ranges.map((p) => (
                      <tr key={`${p.part_number}-${p.currency}`}>
                        <td className="py-2.5 pr-3 font-mono font-semibold text-aviation-dark">{p.part_number}</td>
                        <td className="py-2.5 pr-3 text-right font-mono">{money(p.low, p.currency)}</td>
                        <td className="py-2.5 pr-3 text-right font-mono font-semibold">{money(p.median, p.currency)}</td>
                        <td className="py-2.5 pr-3 text-right font-mono">{money(p.high, p.currency)}</td>
                        <td className="py-2.5 text-right font-mono">{p.suppliers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <section className={card}>
        <SectionHeading title="Market reports" text="Reports and analysis published by the AviaInventory team." />
        {reports.length === 0 ? <Empty>No reports have been published yet. New reports will appear here.</Empty> : (
          <ul className="divide-y divide-aviation-border">
            {reports.map((report) => (
              <li key={report.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <FileText size={20} className="mt-0.5 shrink-0 text-aviation-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-semibold text-aviation-dark">{report.title}</p>
                    {report.summary && <p className={`mt-0.5 text-sm leading-6 ${muted}`}>{report.summary}</p>}
                    <p className={`mt-1 text-xs ${muted}`}>{[report.category, new Date(report.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), formatFileSize(report.file_size)].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
                <a href={`/api/intelligence/reports/${report.id}`} target="_blank" rel="noopener" className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-aviation-primary px-4 text-sm font-semibold text-white hover:opacity-90">Open PDF</a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className={`flex items-start gap-2 text-xs leading-5 ${muted}`}>
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>Based on RFQs and quotes on AviaInventory (cancelled RFQs excluded). Prices, buyer counts and countries are only shown when at least {data?.min_companies ?? 3} companies are behind the figure. <ShieldCheck size={12} className="inline" aria-hidden="true" /> No market data is invented: sections stay empty until there is real activity.</span>
      </p>

      <Link href="/supplier/marketing" className="inline-block text-sm font-semibold text-aviation-primary hover:underline">Back to marketing</Link>
    </main>
  );
}
