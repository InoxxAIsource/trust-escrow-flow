import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { allSEOPages, getAllSlugs } from "@/data/seo-pages";
import { blogPosts } from "@/data/blog-posts";
import { generateAllOffers, filterOffers } from "@/data/seed-engine";

/**
 * Link integrity.
 *
 * The footer is rendered on every page, so a dead link there is a dead link
 * everywhere. These tests read the actual route table out of App.tsx and the
 * actual hrefs out of the components, rather than restating either, so adding
 * a link without a route fails here instead of in someone's browser.
 */

const SRC = resolve(__dirname, "..");

function read(relative: string) {
  return readFileSync(resolve(SRC, relative), "utf8");
}

/** Static paths declared in App.tsx, excluding params and the catch-all. */
function staticRoutes(): Set<string> {
  const app = read("App.tsx");
  const paths = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
  return new Set(paths.filter((p) => !p.includes(":") && p !== "*"));
}

/** Every path the app can actually serve. */
function resolvablePaths(): Set<string> {
  const all = new Set(staticRoutes());
  for (const slug of getAllSlugs()) all.add(`/${slug}`);
  for (const post of blogPosts) all.add(`/blog/${post.slug}`);
  return all;
}

/** Internal hrefs from a component, ignoring params and external links. */
function hrefsIn(relative: string): string[] {
  const source = read(relative);
  return [...source.matchAll(/(?:href|to)[=:]\s*["'](\/[^"'{}]*)["']/g)]
    .map((m) => m[1])
    .filter((h) => !h.includes("${") && !h.includes(":"));
}

describe("footer links", () => {
  const paths = resolvablePaths();

  it("has routes to resolve against", () => {
    expect(paths.size).toBeGreaterThan(10);
  });

  it("resolves every footer link", () => {
    const dead = hrefsIn("components/layout/Footer.tsx").filter((h) => !paths.has(h));
    expect(dead, `dead footer links: ${dead.join(", ")}`).toEqual([]);
  });

  it("resolves every header link", () => {
    const dead = hrefsIn("components/layout/Header.tsx").filter((h) => !paths.has(h));
    expect(dead, `dead header links: ${dead.join(", ")}`).toEqual([]);
  });

  it("resolves every landing page link", () => {
    const dead = hrefsIn("pages/Index.tsx").filter((h) => !paths.has(h));
    expect(dead, `dead landing links: ${dead.join(", ")}`).toEqual([]);
  });
});

describe("blog cross-links", () => {
  const paths = resolvablePaths();

  it("resolves every relatedLinks href across all posts", () => {
    const dead: string[] = [];
    for (const post of blogPosts) {
      for (const link of post.relatedLinks ?? []) {
        if (link.href.startsWith("/") && !paths.has(link.href)) {
          dead.push(`${post.slug} -> ${link.href}`);
        }
      }
    }
    expect(dead, `dead blog links:\n${dead.join("\n")}`).toEqual([]);
  });
});

describe("SEO landing cross-links", () => {
  const paths = resolvablePaths();

  /**
   * The link builders compose hrefs from coin x location x payment without
   * knowing which combinations are actually generated, so an unguarded change
   * to `locations` or `topCombos` silently produces links to pages that were
   * never built. That shipped: 72 internal links pointed at 24 URLs which all
   * answered 200 through the SPA rewrite and read to Google as thin pages.
   */
  function deadLinksIn(kind: "relatedLinks" | "parentLinks"): string[] {
    const dead: string[] = [];
    for (const page of allSEOPages) {
      for (const link of page[kind] ?? []) {
        if (link.href.startsWith("/") && !paths.has(link.href)) {
          dead.push(`${page.slug} -> ${link.href}`);
        }
      }
    }
    return dead;
  }

  it("resolves every relatedLinks href", () => {
    const dead = deadLinksIn("relatedLinks");
    expect(dead, `${dead.length} dead related links:\n${dead.slice(0, 20).join("\n")}`).toEqual([]);
  });

  it("resolves every parentLinks href", () => {
    const dead = deadLinksIn("parentLinks");
    expect(dead, `${dead.length} dead parent links:\n${dead.slice(0, 20).join("\n")}`).toEqual([]);
  });

  it("resolves every breadcrumb href", () => {
    const dead: string[] = [];
    for (const page of allSEOPages) {
      for (const crumb of page.breadcrumbs ?? []) {
        if (crumb.href?.startsWith("/") && !paths.has(crumb.href)) {
          dead.push(`${page.slug} -> ${crumb.href}`);
        }
      }
    }
    expect(dead, `${dead.length} dead breadcrumbs:\n${dead.slice(0, 20).join("\n")}`).toEqual([]);
  });

  it("leaves every page with somewhere to go", () => {
    // Pruning dead links must not strip a page bare -- a landing with no
    // outbound links is a crawl dead end and orphans everything below it.
    const orphans = allSEOPages
      .filter((p) => (p.relatedLinks?.length ?? 0) + (p.parentLinks?.length ?? 0) === 0)
      .map((p) => p.slug);
    expect(orphans, `pages with no internal links:\n${orphans.join("\n")}`).toEqual([]);
  });
});

describe("every landing page has a live board", () => {
  const offers = generateAllOffers();

  /**
   * A landing page whose filter matches nothing renders a live URL with an
   * empty offer table. That shipped for the whole eurozone: seed-engine
   * carried one "Europe" country while the pages filtered on "Germany",
   * "France" and so on, so 64 indexed pages had nothing on them.
   *
   * The two files agree by string, which is the fragile part -- this asserts
   * the join rather than trusting it.
   */
  it("matches at least one offer for every page", () => {
    const empty = allSEOPages
      .filter((p) => filterOffers(offers, p.filterConfig).length === 0)
      .map((p) => p.slug);
    expect(empty, `${empty.length} pages with no offers:\n${empty.slice(0, 20).join("\n")}`).toEqual([]);
  });

  it("quotes every page in its own market's currency", () => {
    const wrong: string[] = [];
    for (const page of allSEOPages) {
      if (!page.filterConfig.country) continue;
      const matched = filterOffers(offers, page.filterConfig);
      const currencies = new Set(matched.map((o) => o.currency));
      if (currencies.size > 1) wrong.push(`${page.slug}: ${[...currencies].join("/")}`);
    }
    expect(wrong, `pages mixing currencies:\n${wrong.join("\n")}`).toEqual([]);
  });
});

describe("sitemap matches the route table", () => {
  it("lists only URLs the app serves, and every indexable one", () => {
    const xml = readFileSync(resolve(SRC, "../public/sitemap.xml"), "utf8");
    const listed = new Set(
      [...xml.matchAll(/<loc>https:\/\/p2pxbt\.com([^<]*)<\/loc>/g)].map((m) =>
        m[1].length > 1 ? m[1].replace(/\/$/, "") : "/",
      ),
    );

    const paths = resolvablePaths();
    const NOINDEX = new Set(["/auth", "/dashboard", "/verify", "/admin", "/admin/risk", "/admin/trade"]);

    const phantom = [...listed].filter((u) => !paths.has(u));
    expect(phantom, `sitemap lists ${phantom.length} URLs that 404:\n${phantom.slice(0, 20).join("\n")}`).toEqual([]);

    const missing = [...paths].filter(
      (u) => !listed.has(u) && !NOINDEX.has(u) && !u.startsWith("/admin"),
    );
    expect(missing, `${missing.length} indexable URLs missing from sitemap:\n${missing.slice(0, 20).join("\n")}`).toEqual([]);
  });
});
