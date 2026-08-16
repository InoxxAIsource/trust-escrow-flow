/**
 * Asserts that every URL anyone knows about resolves to something.
 *
 * "Knows about" means: served by the old site (archived snapshot), or present
 * in Search Console, or listed in our own sitemap. Each must either be a live
 * route or carry a redirect in vercel.json, and every redirect must point at a
 * live route rather than at another redirect or at nothing.
 *
 * Run with `npm run seo:verify`. Exits non-zero on the first gap.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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

const { redirects } = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8"));
const redirectMap = new Map(redirects.map((r) => [r.source, r.destination]));

const norm = (u) => {
  const p = u.replace(/^https?:\/\/[^/]+/, "").split("?")[0].split("#")[0];
  return p.length > 1 ? p.replace(/\/$/, "") : "/";
};

// ── Everything anyone knows about ─────────────────────────────────────────
const known = new Set();

const archiveRoot = resolve(root, "archive/p2pxbt-live-snapshot");
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".html")) {
      let rel = relative(archiveRoot, p).replace(/\\/g, "/");
      rel = rel.replace(/index\.html$/, "").replace(/\.html$/, "").replace(/__/g, "/");
      known.add(norm("/" + rel.replace(/^\/+|\/+$/g, "")));
    }
  }
})(archiveRoot);

const csv = readFileSync(resolve(root, "scripts/data/gsc-pages.csv"), "utf8");
for (const line of csv.trim().split(/\r?\n/).slice(1)) {
  const url = line.split(",")[0];
  if (url.startsWith("http")) known.add(norm(url));
}

const sitemap = readFileSync(resolve(root, "public/sitemap.xml"), "utf8");
for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) known.add(norm(m[1]));

// ── Checks ────────────────────────────────────────────────────────────────
const problems = [];

for (const url of known) {
  if (live.has(url)) continue;
  const to = redirectMap.get(url);
  if (!to) problems.push(`no route and no redirect: ${url}`);
  else if (!live.has(norm(to))) problems.push(`redirect points nowhere: ${url} -> ${to}`);
}

for (const [source, destination] of redirectMap) {
  if (redirectMap.has(norm(destination))) {
    problems.push(`redirect chain: ${source} -> ${destination} -> ${redirectMap.get(norm(destination))}`);
  }
  if (live.has(source)) {
    problems.push(`redirect shadows a live route: ${source}`);
  }
}

console.log(`known URLs      : ${known.size}`);
console.log(`live routes     : ${live.size}`);
console.log(`redirects       : ${redirectMap.size}`);
console.log(`unresolved      : ${problems.length}`);

if (problems.length) {
  console.error("\n" + problems.slice(0, 40).join("\n"));
  if (problems.length > 40) console.error(`… and ${problems.length - 40} more`);
  process.exit(1);
}
console.log("\nEvery known URL resolves to a live route.");
