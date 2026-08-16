import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";

export interface LegalSection {
  heading: string;
  /** Paragraphs and bullet lists, rendered in order. */
  body: Array<string | string[]>;
}

/**
 * Shared shell for the policy pages.
 *
 * Measure is capped at 70ch because legal text is read linearly and long
 * lines are where people lose their place. Headings are numbered so a support
 * conversation can reference a clause by number.
 */
export function LegalPage({
  title,
  description,
  path,
  updated,
  intro,
  sections,
}: {
  title: string;
  description: string;
  path: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="container py-12 lg:py-16">
      <SEOHead
        title={`${title} — P2PxBT`}
        description={description}
        canonical={`https://p2pxbt.com${path}`}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: title, href: path },
        ]}
      />

      <article className="mx-auto max-w-[70ch]">
        <header className="border-b border-border pb-6">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">Last updated {updated}</p>
          <p className="mt-4 leading-relaxed text-muted-foreground">{intro}</p>
        </header>

        <div className="mt-10 space-y-10">
          {sections.map((section, i) => (
            <section key={section.heading}>
              <h2 className="font-display text-lg font-semibold text-foreground">
                <span className="mr-2 font-mono text-sm text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {section.heading}
              </h2>

              <div className="mt-3 space-y-3">
                {section.body.map((block, j) =>
                  Array.isArray(block) ? (
                    <ul key={j} className="space-y-2 pl-5">
                      {block.map((item) => (
                        <li
                          key={item}
                          className="list-disc text-sm leading-relaxed text-muted-foreground marker:text-border"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p key={j} className="text-sm leading-relaxed text-muted-foreground">
                      {block}
                    </p>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
