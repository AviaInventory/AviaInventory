import Footer from "@/components/layout/Footer";

export type LegalSection = { id: string; heading: string; body: React.ReactNode };

export default function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: React.ReactNode;
  sections: LegalSection[];
}) {
  return (
    <>
      <main className="min-h-screen bg-aviation-light py-10 sm:py-16">
        <article className="mx-auto max-w-3xl rounded-2xl border border-aviation-border bg-white px-5 py-8 shadow-sm sm:px-10 sm:py-12">
          <h1 className="text-3xl font-bold tracking-tight text-aviation-dark sm:text-4xl">{title}</h1>
          <div className="mt-6 text-sm leading-7 text-aviation-dark">{intro}</div>

          <nav aria-label="Contents" className="mt-8 rounded-xl bg-aviation-light p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-aviation-muted">Contents</p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-aviation-primary hover:underline">
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="mt-10 scroll-mt-24">
              <h2 className="text-xl font-bold text-aviation-primary">
                {index + 1}. {section.heading}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-aviation-dark [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
                {section.body}
              </div>
            </section>
          ))}
        </article>
      </main>
      <Footer />
    </>
  );
}
