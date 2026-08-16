/**
 * Generates public/llms.txt — the emerging convention for telling LLM crawlers
 * what a site is and which URLs matter, in the order a reader should take them.
 *
 * Generated rather than hand-written for the same reason as the sitemap: a
 * hand-maintained index of 135 URLs drifts, and a stale one is worse than none
 * because it asserts pages that no longer exist.
 *
 * Spec: https://llmstxt.org — H1 name, blockquote summary, then H2 sections of
 * annotated links.
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://p2pxbt.com";

const server = await createServer({
  root, server: { middlewareMode: true }, appType: "custom", logLevel: "error",
});
const seo = await server.ssrLoadModule("/src/data/seo-pages.ts");
const blog = await server.ssrLoadModule("/src/data/blog-posts.ts");
await server.close();

const pages = seo.allSEOPages;
const bySlug = new Map(pages.map((p) => [p.slug, p]));

/** Hub pages: one path segment past the action, e.g. /buy-bitcoin. */
const hubs = pages
  .filter((p) => /^buy-(bitcoin|ethereum|solana|usdt)$/.test(p.slug))
  .sort((a, b) => a.slug.localeCompare(b.slug));

/** Market pages for the four covered regions. */
const MARKETS = ["usa", "uk", "germany", "france", "netherlands", "ireland", "spain", "italy", "hong-kong"];
const markets = MARKETS.flatMap((m) =>
  ["bitcoin", "ethereum", "solana", "usdt"]
    .map((c) => bySlug.get(`buy-${c}-${m}`))
    .filter(Boolean),
);

const line = (path, label, note) =>
  `- [${label}](${SITE}${path})${note ? `: ${note}` : ""}`;

const out = `# P2PxBT

> A peer-to-peer cryptocurrency marketplace covering the United States, United
> Kingdom, Europe and Hong Kong. Buyers are matched with counterparties who
> quote their own spread over a live reference price; payment details are
> issued by an operator in the trade chat rather than published on a listing,
> and identity verification is required before a first trade.

Assets traded: BTC, ETH, SOL, USDT. Payment rails: USA Bank Wire, ACH Transfer,
UK Faster Payments, SEPA Transfer, FPS Transfer (Hong Kong), Bank Transfer.

Pricing is derived from a live reference feed: sellers quote a 4.00%–6.00%
premium over mid, buyers a 2.00%–4.00% discount under it. Each counterparty's
spread is fixed, so listings compete on price.

## Core

${line("/", "Home", "marketplace overview and live reference prices")}
${line("/marketplace", "Marketplace", "live offers across all four assets and markets")}
${line("/how-it-works", "How it works", "the trade lifecycle from verification to completion")}
${line("/fees", "Fees", "what a trade costs and how spreads are set")}

## Assets

${hubs.map((p) => line(`/${p.slug}`, p.title, p.metaDescription.split(".")[0])).join("\n")}

## Markets

${markets.map((p) => line(`/${p.slug}`, p.title)).join("\n")}

## Guides

${blog.blogPosts.map((p) => line(`/blog/${p.slug}`, p.title, p.excerpt.split(".")[0])).join("\n")}

## Policies

${line("/terms", "Terms of Service")}
${line("/privacy", "Privacy Policy")}

## Notes

- Trading requires identity verification approved by an operator. The platform
  does not support anonymous or no-KYC trading.
- Supported payment rails are bank transfers only. PayPal, Venmo, Zelle, Cash
  App and mobile-money rails are not supported.
- Coverage is limited to the United States, United Kingdom, the eurozone and
  Hong Kong. Other markets are not served.
`;

writeFileSync(resolve(root, "public/llms.txt"), out, "utf8");
console.log(`llms.txt: ${hubs.length} hubs, ${markets.length} market pages, ${blog.blogPosts.length} guides`);
