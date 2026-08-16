/**
 * Generates public/sitemap.xml from the routes the app actually serves.
 *
 * The previous sitemap was hand-maintained and drifted badly: it listed 282
 * URLs of which 237 no longer existed, every one returning 200 through the SPA
 * rewrite, so Google saw 237 soft 404s and was told to recrawl them daily.
 *
 * Reading the route table at build time makes that class of drift impossible.
 * Run via `npm run build` (prebuild) or directly.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://p2pxbt.com";

/** Pages that exist but must never be indexed: private, per-user, or app state. */
const NOINDEX = new Set([
  "/auth",
  "/dashboard",
  "/verify",
  "/admin",
  "/admin/risk",
]);

/**
 * Crawl priority. These are hints, not rankings — the point is to tell Google
 * the hubs matter more than the long tail, which is the opposite of what a
 * flat sitemap says.
 */
function weightFor(path) {
  if (path === "/") return { priority: "1.0", changefreq: "daily" };
  if (path === "/marketplace") return { priority: "0.9", changefreq: "daily" };
  if (path === "/blog" || path === "/how-it-works" || path === "/fees") {
    return { priority: "0.8", changefreq: "weekly" };
  }
  if (path.startsWith("/blog/")) return { priority: "0.7", changefreq: "monthly" };
  // Hub landings (/buy-bitcoin) outrank the long tail (/buy-bitcoin-uk-sepa).
  const depth = path.split("-").length;
  if (depth <= 2) return { priority: "0.8", changefreq: "weekly" };
  if (depth === 3) return { priority: "0.6", changefreq: "monthly" };
  return { priority: "0.5", changefreq: "monthly" };
}

async function collect() {
  // Load the TS modules through Vite so the generated slug list is the real
  // one, not a regex guess at the source.
  const server = await createServer({
    root,
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "error",
  });

  try {
    const seo = await server.ssrLoadModule("/src/data/seo-pages.ts");
    const blog = await server.ssrLoadModule("/src/data/blog-posts.ts");

    const appTsx = readFileSync(resolve(root, "src/App.tsx"), "utf8");
    const staticRoutes = [...appTsx.matchAll(/path="(\/[^":*]*)"/g)]
      .map((m) => m[1])
      .filter((r) => !r.includes(":") && r !== "*");

    const urls = new Set(staticRoutes);
    for (const slug of seo.getAllSlugs()) urls.add(`/${slug}`);
    for (const post of blog.blogPosts) urls.add(`/blog/${post.slug}`);

    return [...urls].filter((u) => !NOINDEX.has(u)).sort();
  } finally {
    await server.close();
  }
}

const urls = await collect();
const today = new Date().toISOString().slice(0, 10);

const body = urls
  .map((path) => {
    const { priority, changefreq } = weightFor(path);
    const loc = path === "/" ? `${SITE}/` : `${SITE}${path}`;
    return `  <url><loc>${loc}</loc><lastmod>${today}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
  })
  .join("\n");

writeFileSync(
  resolve(root, "public/sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
  "utf8",
);

console.log(`sitemap.xml: ${urls.length} URLs (${NOINDEX.size} private routes excluded)`);
