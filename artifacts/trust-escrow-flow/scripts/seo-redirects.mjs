/**
 * Builds the redirect map for URLs the old site served and this one does not.
 *
 * The SPA rewrite answers every path with 200 and a client-rendered "not
 * found", so Google currently sees ~88 previously-indexed URLs as soft 404s
 * rather than gone. Each one needs a real answer:
 *
 *   301  where a surviving page serves the same intent (a dropped market's
 *        coin page -> that coin's hub). Passes signal, keeps the click.
 *   410  where nothing does. "Gone" drops it from the index faster than 404
 *        and stops the recrawls.
 *
 * Prints vercel.json `redirects` entries. Reads the archived snapshot of the
 * old site, so it does not depend on Search Console being re-exported.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const archiveRoot = resolve(root, "archive/p2pxbt-live-snapshot");

/**
 * URLs Search Console has on file. The archived snapshot is a crawl and misses
 * anything the crawler never reached -- the India city pages and -india-upi
 * combos were indexed and earning clicks but absent from the archive, so a
 * redirect map built from the archive alone left them answering 200.
 *
 * Export: Performance > Pages > Export. Regenerate this file when re-exporting.
 */
function gscUrls() {
  const csv = readFileSync(resolve(root, "scripts/data/gsc-pages.csv"), "utf8");
  const out = new Set();
  for (const line of csv.trim().split(/\r?\n/).slice(1)) {
    const url = line.split(",")[0];
    if (!url.startsWith("http")) continue;
    const path = url.replace(/^https?:\/\/[^/]+/, "").split("?")[0];
    out.add(path.length > 1 ? path.replace(/\/$/, "") : "/");
  }
  return out;
}

function oldUrls() {
  const out = new Set();
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith(".html")) {
        let rel = relative(archiveRoot, p).replace(/\\/g, "/");
        // The archiver flattened nesting: /blog/x was saved as blog__x.html
        rel = rel.replace(/index\.html$/, "").replace(/\.html$/, "").replace(/__/g, "/");
        rel = "/" + rel.replace(/^\/+|\/+$/g, "");
        out.add(rel === "/" ? "/" : rel);
      }
    }
  })(archiveRoot);
  return out;
}

const server = await createServer({
  root, server: { middlewareMode: true }, appType: "custom", logLevel: "error",
});
const seo = await server.ssrLoadModule("/src/data/seo-pages.ts");
const blog = await server.ssrLoadModule("/src/data/blog-posts.ts");
await server.close();

const appTsx = readFileSync(resolve(root, "src/App.tsx"), "utf8");
const live = new Set(
  [...appTsx.matchAll(/path="(\/[^":*]*)"/g)].map((m) => m[1]).filter((r) => !r.includes(":")),
);
for (const s of seo.getAllSlugs()) live.add(`/${s}`);
for (const p of blog.blogPosts) live.add(`/blog/${p.slug}`);

/**
 * Nearest surviving page for a dead URL, or null for 410.
 *
 * Only ever redirects to something that serves the same intent. A dropped
 * market's Bitcoin page goes to the Bitcoin hub, not to the homepage --
 * redirecting everything to / is treated as a soft 404 anyway, so it buys
 * nothing and loses the topical match.
 */
function target(dead) {
  const coin = dead.match(/^\/(?:buy|sell)-(bitcoin|ethereum|solana|usdt)\b/)?.[1];

  if (coin) {
    // /buy-usdt-india-upi -> /buy-usdt-india -> /buy-usdt : walk up to the
    // first ancestor that still exists.
    const parts = dead.replace(/^\//, "").split("-");
    for (let i = parts.length - 1; i >= 2; i--) {
      const candidate = "/" + parts.slice(0, i).join("-");
      if (live.has(candidate)) return candidate;
    }
    if (live.has(`/buy-${coin}`)) return `/buy-${coin}`;
  }

  // Old blog posts land on the index rather than home — closer intent.
  if (dead.startsWith("/blog/")) return "/blog";

  // Bare payment-rail hubs (/upi, /sepa) were pages in their own right. The
  // USDT page for that rail is the nearest surviving equivalent, since USDT is
  // what the overwhelming majority of rail-led searches want.
  const railPage = `/buy-usdt-${dead.replace(/^\//, "")}`;
  if (live.has(railPage)) return railPage;

  // Nothing topical left. Home, rather than a dead end: every URL has to
  // resolve, so this is the floor rather than a preference.
  return "/";
}

const known = new Set([...oldUrls(), ...gscUrls()]);
const dead = [...known].filter((u) => !live.has(u)).sort();
const redirects = [];
const gone = [];

for (const url of dead) {
  const to = target(url);
  if (to) redirects.push({ source: url, destination: to, permanent: true });
  else gone.push(url);
}

console.log(`dead URLs: ${dead.length}  ->  ${redirects.length} redirects, ${gone.length} gone\n`);
console.log("── vercel.json redirects ──");
console.log(JSON.stringify(redirects, null, 2));
console.log("\n── 410 Gone (no equivalent) ──");
console.log(JSON.stringify(gone, null, 2));
