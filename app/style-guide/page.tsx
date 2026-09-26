import { TrustBadge } from "@/components/trust/TrustBadge";

export default function StyleGuidePage() {
  const colors = [
    ["Primary", "--aviation-primary", "#1F5A78"],
    ["Dark neutral", "--aviation-dark", "#16232B"],
    ["Light neutral", "--aviation-light", "#F4F6F5"],
    ["Accent / brass", "--aviation-accent", "#C48A3A"],
    ["Success", "--aviation-success", "#3F7D5A"],
    ["Warning", "--aviation-warning", "#B77A2B"],
    ["Error", "--aviation-error", "#B54A45"],
  ];
  const type = [
    ["H1", "3rem", "700"], ["H2", "2.25rem", "700"], ["H3", "1.75rem", "650"],
    ["H4", "1.375rem", "650"], ["Body large", "1.125rem", "400"], ["Body", "1rem", "400"],
    ["Body small", "0.875rem", "400"], ["Label", "0.8125rem", "600"], ["Caption", "0.75rem", "500"],
  ];
  return (
    <main className="min-h-screen bg-aviation-light px-6 py-12 text-aviation-dark md:px-12">
      <div className="mx-auto max-w-6xl space-y-14">
        <header className="border-b border-aviation-border pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aviation-accent">AviaInventory / Design System</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Aviation-grade interface tokens</h1>
          <p className="mt-4 max-w-2xl text-lg text-aviation-muted">A compact visual language inspired by aircraft liveries, instrument panels and hangar materials. Use semantic tokens instead of one-off palette values.</p>
        </header>
        <section>
          <h2 className="text-3xl font-bold">Color</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {colors.map(([name, token, hex]) => <div key={token} className="overflow-hidden rounded-lg border border-aviation-border bg-white shadow-sm"><div className="h-24" style={{ background: `var(${token})` }} /><div className="p-4"><p className="font-semibold">{name}</p><p className="mt-1 font-mono text-xs text-aviation-muted">{token}</p><p className="mt-1 font-mono text-xs text-aviation-muted">{hex}</p></div></div>)}
          </div>
        </section>
        <section>
          <h2 className="text-3xl font-bold">Type</h2>
          <div className="mt-6 overflow-hidden rounded-lg border border-aviation-border bg-white">
            {type.map(([name, size, weight]) => <div key={name} className="grid gap-2 border-b border-aviation-border p-5 last:border-0 md:grid-cols-[140px_1fr_120px] md:items-center"><span className="text-xs font-semibold uppercase tracking-wide text-aviation-muted">{name}</span><span style={{ fontFamily: name.startsWith("H") ? "var(--font-display-family)" : "var(--font-body)", fontSize: size, fontWeight: Number(weight) }}>{name === "Caption" ? "Certified aviation inventory" : "Aircraft parts / inventory"}</span><span className="font-mono text-xs text-aviation-muted">{size} / {weight}</span></div>)}
          </div>
          <div className="mt-4 rounded-lg border border-aviation-border bg-aviation-dark p-5 text-aviation-light"><span className="text-xs uppercase tracking-wide text-aviation-accent">Code / data</span><p className="mt-2 font-mono text-lg">P/N 65-12345-07 · USD 12,480.00 · QTY 04</p></div>
        </section>
        <section>
          <h2 className="text-3xl font-bold">Controls & states</h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="rounded-lg border border-aviation-border bg-white p-6"><p className="mb-4 text-sm font-semibold text-aviation-muted">Buttons</p><div className="flex flex-wrap gap-3"><button className="rounded-md bg-aviation-primary px-5 py-3 text-sm font-semibold text-white shadow-sm">Primary action</button><button className="rounded-md bg-aviation-dark px-5 py-3 text-sm font-semibold text-white">Dark action</button><button className="rounded-md border border-aviation-border bg-white px-5 py-3 text-sm font-semibold text-aviation-dark">Secondary</button><button className="rounded-md bg-aviation-accent px-5 py-3 text-sm font-semibold text-aviation-dark">Accent</button></div><div className="mt-5 flex flex-wrap gap-3"><span className="rounded-full bg-aviation-success-soft px-3 py-1 text-xs font-semibold text-aviation-success">Certified / Complete</span><span className="rounded-full bg-aviation-warning-soft px-3 py-1 text-xs font-semibold text-aviation-warning">Pending / Review</span><span className="rounded-full bg-aviation-error-soft px-3 py-1 text-xs font-semibold text-aviation-error">Rejected / Error</span></div></div>
            <div className="rounded-lg border border-aviation-border bg-white p-6"><p className="mb-4 text-sm font-semibold text-aviation-muted">Inputs</p><div className="space-y-4"><input aria-label="Default input" defaultValue="Search part number or description" className="w-full rounded-md border border-aviation-border bg-white px-4 py-3 text-sm text-aviation-dark outline-none focus:border-aviation-primary focus:ring-2 focus:ring-aviation-primary/20" /><input aria-label="Disabled input" disabled defaultValue="Disabled input" className="w-full rounded-md border border-aviation-border bg-aviation-light px-4 py-3 text-sm text-aviation-muted" /><input aria-label="Error input" defaultValue="Invalid part number" className="w-full rounded-md border border-aviation-error bg-white px-4 py-3 text-sm text-aviation-dark outline-none focus:ring-2 focus:ring-aviation-error/20" /></div></div>
          </div>
        </section>
        <section>
          <h2 className="text-3xl font-bold">Certification & trust badges</h2>
          <p className="mt-2 max-w-2xl text-sm text-aviation-muted">One shape, one scale, four meanings. Hover or focus a badge to see its plain-language explanation.</p>
          <div className="mt-6 flex flex-wrap gap-3 rounded-lg border border-aviation-border bg-white p-6">
            <TrustBadge kind="faa" />
            <TrustBadge kind="easa" />
            <TrustBadge kind="verified" />
            <TrustBadge kind="buyer-protection" />
            <TrustBadge kind="none" />
          </div>
        </section>
        <section>
          <h2 className="text-3xl font-bold">Layout tokens</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3"><div className="rounded-lg border border-aviation-border bg-white p-5"><p className="font-semibold">Spacing</p><p className="mt-2 font-mono text-sm text-aviation-muted">4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96px</p></div><div className="rounded-lg border border-aviation-border bg-white p-5"><p className="font-semibold">Radius</p><p className="mt-2 font-mono text-sm text-aviation-muted">6 · 10 · 14 · 18px · pill</p></div><div className="rounded-lg border border-aviation-border bg-white p-5 shadow-md"><p className="font-semibold">Elevation</p><p className="mt-2 font-mono text-sm text-aviation-muted">sm · md · lg · xl</p></div></div>
        </section>
      </div>
    </main>
  );
}
