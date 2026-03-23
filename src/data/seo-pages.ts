// ============================================================
// SEO PAGE GENERATOR — Programmatic SEO at Scale
// Generates 80+ unique pages across coins, countries, payments,
// and combination pages for maximum search coverage.
// ============================================================

export interface SEOPageData {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  action: "buy" | "sell";
  coin: string;
  coinSymbol: string;
  location?: string;
  paymentMethod?: string;
  contentSections: { heading: string; text: string }[];
  relatedLinks: { label: string; href: string }[];
  breadcrumbs: { label: string; href: string }[];
  filterConfig: { asset?: string; country?: string; paymentMethod?: string; type?: "buy" | "sell" };
}

// ── Master data ──
const coins = [
  { name: "USDT", symbol: "USDT", slug: "usdt", fullName: "Tether (USDT)", desc: "the most popular stablecoin, pegged 1:1 to the US Dollar" },
  { name: "Bitcoin", symbol: "BTC", slug: "bitcoin", fullName: "Bitcoin (BTC)", desc: "the world's first and most valuable cryptocurrency" },
  { name: "Ethereum", symbol: "ETH", slug: "ethereum", fullName: "Ethereum (ETH)", desc: "the leading smart contract platform" },
  { name: "Solana", symbol: "SOL", slug: "solana", fullName: "Solana (SOL)", desc: "one of the fastest blockchain networks" },
];

const locations = [
  { name: "India", slug: "india", currency: "INR", payments: ["UPI", "IMPS", "Bank Transfer", "PayTM", "Google Pay"] },
  { name: "USA", slug: "usa", currency: "USD", payments: ["Zelle", "Venmo", "Bank Transfer", "CashApp", "PayPal"] },
  { name: "UK", slug: "uk", currency: "GBP", payments: ["Bank Transfer", "Faster Payments", "PayPal", "Revolut"] },
  { name: "UAE", slug: "uae", currency: "AED", payments: ["Bank Transfer", "Cash Deposit"] },
  { name: "Nigeria", slug: "nigeria", currency: "NGN", payments: ["Bank Transfer", "OPay"] },
  { name: "Turkey", slug: "turkey", currency: "TRY", payments: ["Bank Transfer", "Papara"] },
  { name: "Germany", slug: "germany", currency: "EUR", payments: ["SEPA", "Bank Transfer", "PayPal"] },
  { name: "Canada", slug: "canada", currency: "CAD", payments: ["Interac e-Transfer", "Bank Transfer"] },
  { name: "Australia", slug: "australia", currency: "AUD", payments: ["Bank Transfer", "PayID"] },
  { name: "Brazil", slug: "brazil", currency: "BRL", payments: ["PIX", "Bank Transfer"] },
  { name: "Philippines", slug: "philippines", currency: "PHP", payments: ["GCash", "Bank Transfer", "Maya"] },
  { name: "Indonesia", slug: "indonesia", currency: "IDR", payments: ["Bank Transfer", "OVO", "Dana"] },
  { name: "Kenya", slug: "kenya", currency: "KES", payments: ["M-Pesa", "Bank Transfer"] },
  { name: "Singapore", slug: "singapore", currency: "SGD", payments: ["Bank Transfer", "PayNow"] },
  { name: "Mexico", slug: "mexico", currency: "MXN", payments: ["SPEI", "Bank Transfer"] },
];

const paymentMethods = [
  { name: "UPI", slug: "upi", desc: "India's instant payment system" },
  { name: "Bank Transfer", slug: "bank-transfer", desc: "traditional bank wire transfer" },
  { name: "PayPal", slug: "paypal", desc: "the world's most popular online payment platform" },
  { name: "Zelle", slug: "zelle", desc: "instant bank-to-bank transfers in the US" },
  { name: "Venmo", slug: "venmo", desc: "popular mobile payment app in the US" },
  { name: "SEPA", slug: "sepa", desc: "eurozone bank transfers" },
  { name: "PIX", slug: "pix", desc: "Brazil's instant payment system" },
  { name: "M-Pesa", slug: "mpesa", desc: "mobile money in Africa" },
  { name: "GCash", slug: "gcash", desc: "Philippines' leading mobile wallet" },
  { name: "Revolut", slug: "revolut", desc: "digital banking platform" },
  { name: "CashApp", slug: "cashapp", desc: "mobile payment service by Square" },
  { name: "Interac e-Transfer", slug: "interac", desc: "Canadian instant bank transfers" },
  { name: "IMPS", slug: "imps", desc: "India's immediate payment service" },
];

function buildRelatedLinks(coin: typeof coins[0], loc?: typeof locations[0], pm?: typeof paymentMethods[0]): { label: string; href: string }[] {
  const links: { label: string; href: string }[] = [];

  // Related coins
  coins.filter(c => c.slug !== coin.slug).forEach(c => {
    const base = loc ? `-${loc.slug}` : "";
    links.push({ label: `Buy ${c.name}${loc ? ` in ${loc.name}` : ""}`, href: `/buy-${c.slug}${base}` });
  });

  // Related locations
  if (loc) {
    locations.filter(l => l.slug !== loc.slug).slice(0, 4).forEach(l => {
      links.push({ label: `Buy ${coin.name} in ${l.name}`, href: `/buy-${coin.slug}-${l.slug}` });
    });
  } else {
    locations.slice(0, 4).forEach(l => {
      links.push({ label: `Buy ${coin.name} in ${l.name}`, href: `/buy-${coin.slug}-${l.slug}` });
    });
  }

  // Related payment methods
  if (pm) {
    paymentMethods.filter(p => p.slug !== pm.slug).slice(0, 3).forEach(p => {
      links.push({ label: `Buy ${coin.name} with ${p.name}`, href: `/buy-${coin.slug}-${p.slug}` });
    });
  }

  // Sell counterpart
  links.push({ label: `Sell ${coin.name}`, href: `/sell-${coin.slug}` });

  // Blog links
  links.push({ label: "How It Works", href: "/how-it-works" });
  links.push({ label: "View Marketplace", href: "/marketplace" });

  return links.slice(0, 12);
}

function buildContentSections(coin: typeof coins[0], loc?: typeof locations[0], pm?: typeof paymentMethods[0]): { heading: string; text: string }[] {
  const sections: { heading: string; text: string }[] = [];

  sections.push({
    heading: `What is ${coin.name}?`,
    text: `${coin.fullName} is ${coin.desc}. It's one of the most traded cryptocurrencies on peer-to-peer platforms worldwide. ${coin.symbol === "USDT" ? "As a stablecoin, USDT maintains a 1:1 peg with the US Dollar, making it ideal for trading and storing value." : `${coin.name} has established itself as a leading digital asset with strong community support and growing adoption.`}`,
  });

  const locText = loc ? ` in ${loc.name}` : "";
  const pmText = pm ? ` using ${pm.name}` : "";

  sections.push({
    heading: `How to ${coin.name === "USDT" ? "Buy" : "Buy"} ${coin.name}${locText}${pmText}`,
    text: `Buying ${coin.fullName}${locText}${pmText} on TrustP2P is simple and secure:\n\n1. **Browse offers** — Find the best rates from verified traders\n2. **Start the trade** — Select an offer and enter the amount you want to buy\n3. **Funds locked in escrow** — The seller's ${coin.symbol} is locked securely\n4. **Make payment** — Send payment via ${pm ? pm.name : "your preferred method"}\n5. **Receive ${coin.symbol}** — Once confirmed, crypto is released to your wallet`,
  });

  if (pm) {
    sections.push({
      heading: `Why Use ${pm.name}?`,
      text: `${pm.name} is ${pm.desc}. It's a fast, convenient, and widely-used payment method for P2P crypto trading. When combined with TrustP2P's escrow protection, ${pm.name} provides a seamless and secure trading experience.`,
    });
  }

  if (loc) {
    sections.push({
      heading: `Crypto Trading in ${loc.name}`,
      text: `${loc.name} is a growing market for peer-to-peer cryptocurrency trading. Popular payment methods include ${loc.payments.slice(0, 3).join(", ")}. TrustP2P offers competitive rates in ${loc.currency} with escrow protection on every trade.`,
    });
  }

  sections.push({
    heading: "Why Use Escrow Protection?",
    text: "Escrow protection is the gold standard for safe P2P crypto trading. When you trade on TrustP2P, the seller's cryptocurrency is locked in a secure escrow wallet. Funds are only released when both parties confirm the trade is complete. This eliminates the risk of fraud and ensures a fair outcome for everyone.",
  });

  sections.push({
    heading: "Best Rates, Verified Traders",
    text: `TrustP2P connects you with verified traders offering competitive ${coin.name} rates. Every trader has a public rating, completion rate, and trade history. Look for traders with high ratings (4.5+) and hundreds of completed trades for the safest experience.`,
  });

  return sections;
}

// ══════════════════════════════════════════════
// 1. COIN PAGES — /buy-{coin}, /sell-{coin}
// ══════════════════════════════════════════════
const coinPages: SEOPageData[] = coins.flatMap((coin) =>
  (["buy", "sell"] as const).map((action) => ({
    slug: `${action}-${coin.slug}`,
    title: `${action === "buy" ? "Buy" : "Sell"} ${coin.name}`,
    metaTitle: `${action === "buy" ? "Buy" : "Sell"} ${coin.name} Safely with Escrow | Best P2P Rates | TrustP2P`,
    metaDescription: `${action === "buy" ? "Buy" : "Sell"} ${coin.fullName} securely on TrustP2P with escrow protection. Multiple payment methods, verified traders, and the best P2P rates.`,
    h1: `${action === "buy" ? "Buy" : "Sell"} ${coin.name} with Escrow Protection`,
    intro: `${action === "buy" ? "Buy" : "Sell"} ${coin.fullName} safely on TrustP2P. Our escrow system locks funds until both parties confirm, ensuring zero risk of fraud. Choose from verified traders, pick your preferred payment method, and trade in minutes.`,
    action,
    coin: coin.name,
    coinSymbol: coin.symbol,
    contentSections: buildContentSections(coin),
    relatedLinks: buildRelatedLinks(coin),
    breadcrumbs: [{ label: "Home", href: "/" }, { label: `${action === "buy" ? "Buy" : "Sell"} ${coin.name}`, href: `/${action}-${coin.slug}` }],
    filterConfig: { asset: coin.name, type: action },
  }))
);

// ══════════════════════════════════════════════
// 2. COUNTRY PAGES — /buy-{coin}-{country}
// ══════════════════════════════════════════════
const countryPages: SEOPageData[] = coins.flatMap((coin) =>
  locations.map((loc) => ({
    slug: `buy-${coin.slug}-${loc.slug}`,
    title: `Buy ${coin.name} in ${loc.name}`,
    metaTitle: `Buy ${coin.name} in ${loc.name} | Best P2P Rates in ${loc.currency} | TrustP2P`,
    metaDescription: `Buy ${coin.fullName} in ${loc.name} using ${loc.payments.slice(0, 2).join(", ")}. Secure escrow-protected P2P trades with verified traders. Best rates in ${loc.currency}.`,
    h1: `Buy ${coin.name} in ${loc.name}`,
    intro: `Purchase ${coin.fullName} in ${loc.name} using popular payment methods like ${loc.payments.slice(0, 3).join(", ")}. TrustP2P's escrow protection ensures your funds are safe throughout the entire transaction. Get the best ${coin.symbol}/${loc.currency} rates from verified traders.`,
    action: "buy" as const,
    coin: coin.name,
    coinSymbol: coin.symbol,
    location: loc.name,
    contentSections: buildContentSections(coin, loc),
    relatedLinks: buildRelatedLinks(coin, loc),
    breadcrumbs: [{ label: "Home", href: "/" }, { label: `Buy ${coin.name}`, href: `/buy-${coin.slug}` }, { label: loc.name, href: `/buy-${coin.slug}-${loc.slug}` }],
    filterConfig: { asset: coin.name, country: loc.name, type: "buy" },
  }))
);

// ══════════════════════════════════════════════
// 3. PAYMENT PAGES — /buy-{coin}-{payment}
// ══════════════════════════════════════════════
const paymentPages: SEOPageData[] = coins.flatMap((coin) =>
  paymentMethods.map((pm) => ({
    slug: `buy-${coin.slug}-${pm.slug}`,
    title: `Buy ${coin.name} with ${pm.name}`,
    metaTitle: `Buy ${coin.name} with ${pm.name} | Instant P2P Trades | TrustP2P`,
    metaDescription: `Buy ${coin.fullName} instantly with ${pm.name} on TrustP2P. Secure escrow-protected P2P trades with verified traders accepting ${pm.name}.`,
    h1: `Buy ${coin.name} with ${pm.name}`,
    intro: `Buy ${coin.fullName} using ${pm.name} on TrustP2P. ${pm.name} is ${pm.desc}. All trades are protected by our secure escrow system, ensuring safe and instant transactions.`,
    action: "buy" as const,
    coin: coin.name,
    coinSymbol: coin.symbol,
    paymentMethod: pm.name,
    contentSections: buildContentSections(coin, undefined, pm),
    relatedLinks: buildRelatedLinks(coin, undefined, pm),
    breadcrumbs: [{ label: "Home", href: "/" }, { label: `Buy ${coin.name}`, href: `/buy-${coin.slug}` }, { label: pm.name, href: `/buy-${coin.slug}-${pm.slug}` }],
    filterConfig: { asset: coin.name, paymentMethod: pm.name, type: "buy" },
  }))
);

// ══════════════════════════════════════════════
// 4. COMBINATION PAGES — /buy-{coin}-{country}-{payment} (SEO GOLD)
// ══════════════════════════════════════════════
const comboPages: SEOPageData[] = [];
const topCombos: { coin: typeof coins[0]; loc: typeof locations[0]; pm: string }[] = [
  // India combos
  ...["UPI", "IMPS", "Bank Transfer", "Google Pay"].flatMap(pm =>
    coins.map(coin => ({ coin, loc: locations[0], pm })) // India
  ),
  // USA combos
  ...["Zelle", "Venmo", "PayPal", "CashApp"].flatMap(pm =>
    coins.map(coin => ({ coin, loc: locations[1], pm })) // USA
  ),
  // UK combos
  ...["Bank Transfer", "Revolut"].flatMap(pm =>
    coins.map(coin => ({ coin, loc: locations[2], pm })) // UK
  ),
  // UAE
  ...coins.map(coin => ({ coin, loc: locations[3], pm: "Bank Transfer" })),
  // Nigeria
  ...coins.map(coin => ({ coin, loc: locations[4], pm: "Bank Transfer" })),
  // Brazil
  ...coins.map(coin => ({ coin, loc: locations[9], pm: "PIX" })),
  // Philippines
  ...coins.map(coin => ({ coin, loc: locations[10], pm: "GCash" })),
  // Kenya
  ...coins.map(coin => ({ coin, loc: locations[12], pm: "M-Pesa" })),
];

const pmSlugMap: Record<string, string> = {};
paymentMethods.forEach(p => { pmSlugMap[p.name] = p.slug; });

topCombos.forEach(({ coin, loc, pm }) => {
  const pmSlug = pmSlugMap[pm] || pm.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const pmObj = paymentMethods.find(p => p.name === pm) || { name: pm, slug: pmSlug, desc: `a popular payment method` };
  comboPages.push({
    slug: `buy-${coin.slug}-${loc.slug}-${pmSlug}`,
    title: `Buy ${coin.name} in ${loc.name} with ${pm}`,
    metaTitle: `Buy ${coin.name} in ${loc.name} with ${pm} | Best P2P Rates | TrustP2P`,
    metaDescription: `Buy ${coin.fullName} in ${loc.name} using ${pm}. Escrow-protected P2P trades, verified traders, best rates in ${loc.currency}. Trade safely on TrustP2P.`,
    h1: `Buy ${coin.name} in ${loc.name} with ${pm}`,
    intro: `Buy ${coin.fullName} in ${loc.name} using ${pm} on TrustP2P. Get the best ${coin.symbol}/${loc.currency} rates from verified traders. Every trade is protected by our secure escrow system.`,
    action: "buy",
    coin: coin.name,
    coinSymbol: coin.symbol,
    location: loc.name,
    paymentMethod: pm,
    contentSections: buildContentSections(coin, loc, pmObj),
    relatedLinks: buildRelatedLinks(coin, loc, pmObj),
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: `Buy ${coin.name}`, href: `/buy-${coin.slug}` },
      { label: loc.name, href: `/buy-${coin.slug}-${loc.slug}` },
      { label: pm, href: `/buy-${coin.slug}-${loc.slug}-${pmSlug}` },
    ],
    filterConfig: { asset: coin.name, country: loc.name, paymentMethod: pm, type: "buy" },
  });
});

// ══════════════════════════════════════════════
// MASTER EXPORT
// ══════════════════════════════════════════════
export const allSEOPages: SEOPageData[] = [...coinPages, ...countryPages, ...paymentPages, ...comboPages];

// Quick lookup map
const pageMap = new Map<string, SEOPageData>();
allSEOPages.forEach(p => pageMap.set(p.slug, p));

export function getSEOPage(slug: string): SEOPageData | undefined {
  return pageMap.get(slug);
}

export function getAllSlugs(): string[] {
  return allSEOPages.map(p => p.slug);
}

// Page count for stats
export function getPageStats() {
  return {
    total: allSEOPages.length,
    coinPages: coinPages.length,
    countryPages: countryPages.length,
    paymentPages: paymentPages.length,
    comboPages: comboPages.length,
  };
}

export { coinPages, countryPages, paymentPages, comboPages, locations, paymentMethods as paymentMethodsList, coins as coinsList };
