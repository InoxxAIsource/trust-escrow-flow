// ============================================================
// SEO PAGE GENERATOR — Programmatic SEO Engine
// Generates 150+ unique pages across coins, countries, payments,
// and combination pages. Each page has 300+ words of unique content.
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
  faq: { q: string; a: string }[];
  relatedLinks: { label: string; href: string }[];
  parentLinks: { label: string; href: string }[];
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
  { name: "UPI", slug: "upi", desc: "India's instant payment system used by 300M+ people" },
  { name: "Bank Transfer", slug: "bank-transfer", desc: "traditional bank wire transfer available worldwide" },
  { name: "PayPal", slug: "paypal", desc: "the world's most popular online payment platform with buyer protection" },
  { name: "Zelle", slug: "zelle", desc: "instant bank-to-bank transfers available at 1,700+ US banks" },
  { name: "Venmo", slug: "venmo", desc: "popular mobile payment app in the US with social features" },
  { name: "SEPA", slug: "sepa", desc: "the eurozone standard for cross-border bank transfers" },
  { name: "PIX", slug: "pix", desc: "Brazil's revolutionary instant payment system processing billions daily" },
  { name: "M-Pesa", slug: "mpesa", desc: "Africa's leading mobile money platform serving 50M+ users" },
  { name: "GCash", slug: "gcash", desc: "the Philippines' most-used mobile wallet with 80M+ users" },
  { name: "Revolut", slug: "revolut", desc: "digital banking platform popular across Europe and beyond" },
  { name: "CashApp", slug: "cashapp", desc: "mobile payment service by Block (formerly Square)" },
  { name: "Interac e-Transfer", slug: "interac", desc: "Canada's most popular instant bank transfer system" },
  { name: "IMPS", slug: "imps", desc: "India's 24/7 immediate payment service for instant bank transfers" },
];

// ── Content builders ──

function buildRelatedLinks(coin: typeof coins[0], loc?: typeof locations[0], pm?: typeof paymentMethods[0]): { label: string; href: string }[] {
  const links: { label: string; href: string }[] = [];

  // Same country, different payment
  if (loc) {
    const locPms = paymentMethods.filter(p => loc.payments.includes(p.name) && (!pm || p.slug !== pm.slug));
    locPms.slice(0, 3).forEach(p => {
      links.push({ label: `Buy ${coin.name} in ${loc.name} with ${p.name}`, href: `/buy-${coin.slug}-${loc.slug}-${p.slug}` });
    });
  }

  // Same payment, different country
  if (pm) {
    locations.filter(l => l.payments.includes(pm.name) && (!loc || l.slug !== loc.slug)).slice(0, 3).forEach(l => {
      links.push({ label: `Buy ${coin.name} in ${l.name} with ${pm.name}`, href: `/buy-${coin.slug}-${l.slug}-${pm.slug}` });
    });
  }

  // Related coins (same geo)
  coins.filter(c => c.slug !== coin.slug).slice(0, 3).forEach(c => {
    const suffix = loc ? `-${loc.slug}` : "";
    links.push({ label: `Buy ${c.name}${loc ? ` in ${loc.name}` : ""}`, href: `/buy-${c.slug}${suffix}` });
  });

  // Related countries (if no loc yet)
  if (!loc) {
    locations.slice(0, 4).forEach(l => {
      links.push({ label: `Buy ${coin.name} in ${l.name}`, href: `/buy-${coin.slug}-${l.slug}` });
    });
  }

  // Sell counterpart
  links.push({ label: `Sell ${coin.name}`, href: `/sell-${coin.slug}` });
  links.push({ label: "How It Works", href: "/how-it-works" });
  links.push({ label: "View Marketplace", href: "/marketplace" });

  return links.slice(0, 12);
}

function buildParentLinks(coin: typeof coins[0], loc?: typeof locations[0], _pm?: typeof paymentMethods[0]): { label: string; href: string }[] {
  const links: { label: string; href: string }[] = [
    { label: "Home", href: "/" },
    { label: `Buy ${coin.name}`, href: `/buy-${coin.slug}` },
  ];
  if (loc) {
    links.push({ label: `Buy ${coin.name} in ${loc.name}`, href: `/buy-${coin.slug}-${loc.slug}` });
  }
  return links;
}

function buildFAQ(coin: typeof coins[0], loc?: typeof locations[0], pm?: typeof paymentMethods[0]): { q: string; a: string }[] {
  const locText = loc ? ` in ${loc.name}` : "";
  const pmText = pm ? ` with ${pm.name}` : "";
  return [
    {
      q: `Is it safe to buy ${coin.name}${locText}${pmText}?`,
      a: `Yes. TrustP2P uses escrow protection on every trade. The seller's ${coin.symbol} is locked in a secure escrow wallet before you send payment. Funds are only released when both parties confirm the trade. This eliminates fraud risk entirely.`,
    },
    {
      q: `How long does it take to buy ${coin.name}${pmText}?`,
      a: `Most trades complete within 5–15 minutes. After you initiate a trade, you send payment via ${pm ? pm.name : "your chosen method"}, the seller confirms receipt, and ${coin.symbol} is released from escrow to your wallet instantly.`,
    },
    {
      q: `What fees does TrustP2P charge?`,
      a: `TrustP2P charges a small escrow fee of 0.25% per trade. There are no hidden fees, no deposit fees, and no withdrawal fees. The price you see is the price you pay.`,
    },
    {
      q: `Do I need KYC to buy ${coin.name}?`,
      a: `Basic trades can start with email verification. For higher trade limits, identity verification (KYC) is recommended. Verified traders get higher limits, better visibility, and a trust badge on their profile.`,
    },
    {
      q: `What happens if there's a dispute?`,
      a: `If a dispute arises, TrustP2P's support team reviews the evidence from both parties. Since funds are held in escrow, neither party can run away with the money. Disputes are typically resolved within 24 hours.`,
    },
  ];
}

function buildContentSections(coin: typeof coins[0], loc?: typeof locations[0], pm?: typeof paymentMethods[0]): { heading: string; text: string }[] {
  const sections: { heading: string; text: string }[] = [];
  const locText = loc ? ` in ${loc.name}` : "";
  const pmText = pm ? ` using ${pm.name}` : "";

  sections.push({
    heading: `What is ${coin.name}?`,
    text: `${coin.fullName} is ${coin.desc}. It's one of the most traded cryptocurrencies on peer-to-peer platforms worldwide. ${coin.symbol === "USDT" ? "As a stablecoin, USDT maintains a 1:1 peg with the US Dollar, making it ideal for trading, remittances, and storing value without exposure to crypto volatility. Over $50 billion worth of USDT is traded daily across global markets." : `${coin.name} has established itself as a leading digital asset with strong community support, growing institutional adoption, and a market cap in the billions. It's used for investment, payments, and decentralized applications worldwide.`}`,
  });

  sections.push({
    heading: `How to Buy ${coin.name}${locText}${pmText}`,
    text: `Buying ${coin.fullName}${locText}${pmText} on TrustP2P is simple and secure. Follow these steps:\n\n1. **Create your account** — Sign up with your email and verify your identity for higher trade limits\n2. **Browse offers** — Find the best ${coin.symbol} rates from verified traders${loc ? ` in ${loc.name}` : ""}${pm ? ` who accept ${pm.name}` : ""}\n3. **Start the trade** — Select an offer and enter the amount you want to buy in ${loc ? loc.currency : "your local currency"}\n4. **Funds locked in escrow** — The seller's ${coin.symbol} is locked in TrustP2P's secure escrow wallet automatically\n5. **Make payment** — Send payment via ${pm ? pm.name : "your preferred method"} to the seller's details\n6. **Receive ${coin.symbol}** — Once the seller confirms your payment, ${coin.symbol} is released to your TrustP2P wallet instantly`,
  });

  if (pm) {
    sections.push({
      heading: `Why Use ${pm.name} to Buy ${coin.name}?`,
      text: `${pm.name} is ${pm.desc}. It offers fast settlement times, widespread availability, and convenience for P2P crypto trading. When you buy ${coin.name} with ${pm.name} on TrustP2P, your payment is processed quickly and the seller can verify it in real-time. Combined with TrustP2P's escrow protection, ${pm.name} provides one of the safest and most seamless ways to acquire cryptocurrency.`,
    });
  }

  if (loc) {
    sections.push({
      heading: `P2P Crypto Trading in ${loc.name}`,
      text: `${loc.name} is one of the fastest-growing markets for peer-to-peer cryptocurrency trading. With increasing adoption and a tech-savvy population, demand for ${coin.name} continues to rise. Popular payment methods in ${loc.name} include ${loc.payments.join(", ")}. TrustP2P offers competitive rates in ${loc.currency}, connects you with local verified traders, and provides escrow protection on every single trade. Whether you're buying for investment, remittances, or daily use, TrustP2P makes crypto accessible to everyone in ${loc.name}.`,
    });
  }

  sections.push({
    heading: "Why Escrow Protection Matters",
    text: `Escrow protection is the gold standard for safe P2P crypto trading. When you trade on TrustP2P, here's how it works: the seller's cryptocurrency is locked in a secure, non-custodial escrow wallet before any payment is made. The buyer then sends payment directly to the seller using the agreed payment method. Once the seller confirms receipt, the crypto is released from escrow to the buyer's wallet. If there's any disagreement, TrustP2P's dispute resolution team steps in. This system completely eliminates the risk of being scammed — your money and crypto are always protected.`,
  });

  sections.push({
    heading: "Verified Traders & Best Rates",
    text: `TrustP2P connects you with a network of verified traders offering competitive ${coin.name} rates${locText}. Every trader on the platform has a public profile showing their completion rate, average response time, total trade volume, and user rating. We recommend choosing traders with a 4.5+ star rating and 100+ completed trades for the best experience. Our platform also highlights "Recommended" traders who consistently deliver fast, reliable service.`,
  });

  sections.push({
    heading: `${coin.name} Trading Tips`,
    text: `Here are tips for a smooth ${coin.name} trading experience:\n\n- **Compare rates** — Check multiple offers to get the best ${coin.symbol} price${locText}\n- **Verify the trader** — Look for the verification badge and high completion rates\n- **Use escrow** — Never trade outside the platform; always use TrustP2P's escrow\n- **Start small** — If you're new, begin with a smaller trade to build confidence\n- **Stay in chat** — Use the in-trade chat to communicate with your trading partner\n- **Keep records** — Save payment confirmations and trade receipts for your records`,
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
    intro: `${action === "buy" ? "Buy" : "Sell"} ${coin.fullName} safely on TrustP2P. Our escrow system locks funds until both parties confirm, ensuring zero risk of fraud. Choose from verified traders across 15+ countries, pick your preferred payment method, and trade in minutes. Over 12,000 trades completed securely.`,
    action,
    coin: coin.name,
    coinSymbol: coin.symbol,
    contentSections: buildContentSections(coin),
    faq: buildFAQ(coin),
    relatedLinks: buildRelatedLinks(coin),
    parentLinks: [{ label: "Home", href: "/" }],
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
    intro: `Purchase ${coin.fullName} in ${loc.name} using popular payment methods like ${loc.payments.slice(0, 3).join(", ")}. TrustP2P's escrow protection ensures your funds are safe throughout the entire transaction. Get the best ${coin.symbol}/${loc.currency} rates from verified local traders.`,
    action: "buy" as const,
    coin: coin.name,
    coinSymbol: coin.symbol,
    location: loc.name,
    contentSections: buildContentSections(coin, loc),
    faq: buildFAQ(coin, loc),
    relatedLinks: buildRelatedLinks(coin, loc),
    parentLinks: buildParentLinks(coin, loc),
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
    intro: `Buy ${coin.fullName} using ${pm.name} on TrustP2P. ${pm.name} is ${pm.desc}. All trades are protected by our secure escrow system, ensuring safe and instant transactions with verified traders.`,
    action: "buy" as const,
    coin: coin.name,
    coinSymbol: coin.symbol,
    paymentMethod: pm.name,
    contentSections: buildContentSections(coin, undefined, pm),
    faq: buildFAQ(coin, undefined, pm),
    relatedLinks: buildRelatedLinks(coin, undefined, pm),
    parentLinks: buildParentLinks(coin, undefined, pm),
    breadcrumbs: [{ label: "Home", href: "/" }, { label: `Buy ${coin.name}`, href: `/buy-${coin.slug}` }, { label: pm.name, href: `/buy-${coin.slug}-${pm.slug}` }],
    filterConfig: { asset: coin.name, paymentMethod: pm.name, type: "buy" },
  }))
);

// ══════════════════════════════════════════════
// 4. COMBINATION PAGES — /buy-{coin}-{country}-{payment}
// ══════════════════════════════════════════════
const comboPages: SEOPageData[] = [];
const topCombos: { coin: typeof coins[0]; loc: typeof locations[0]; pm: string }[] = [
  // India combos
  ...["UPI", "IMPS", "Bank Transfer", "Google Pay"].flatMap(pm =>
    coins.map(coin => ({ coin, loc: locations[0], pm }))
  ),
  // USA combos
  ...["Zelle", "Venmo", "PayPal", "CashApp"].flatMap(pm =>
    coins.map(coin => ({ coin, loc: locations[1], pm }))
  ),
  // UK combos
  ...["Bank Transfer", "Revolut"].flatMap(pm =>
    coins.map(coin => ({ coin, loc: locations[2], pm }))
  ),
  // UAE
  ...coins.map(coin => ({ coin, loc: locations[3], pm: "Bank Transfer" })),
  // Nigeria
  ...coins.map(coin => ({ coin, loc: locations[4], pm: "Bank Transfer" })),
  // Turkey
  ...coins.map(coin => ({ coin, loc: locations[5], pm: "Bank Transfer" })),
  // Germany
  ...["SEPA", "Bank Transfer"].flatMap(pm =>
    coins.map(coin => ({ coin, loc: locations[6], pm }))
  ),
  // Canada
  ...coins.map(coin => ({ coin, loc: locations[7], pm: "Interac e-Transfer" })),
  // Australia
  ...coins.map(coin => ({ coin, loc: locations[8], pm: "Bank Transfer" })),
  // Brazil
  ...coins.map(coin => ({ coin, loc: locations[9], pm: "PIX" })),
  // Philippines
  ...coins.map(coin => ({ coin, loc: locations[10], pm: "GCash" })),
  // Indonesia
  ...coins.map(coin => ({ coin, loc: locations[11], pm: "Bank Transfer" })),
  // Kenya
  ...coins.map(coin => ({ coin, loc: locations[12], pm: "M-Pesa" })),
  // Singapore
  ...coins.map(coin => ({ coin, loc: locations[13], pm: "Bank Transfer" })),
  // Mexico
  ...coins.map(coin => ({ coin, loc: locations[14], pm: "SPEI" })),
];

const pmSlugMap: Record<string, string> = {};
paymentMethods.forEach(p => { pmSlugMap[p.name] = p.slug; });
// Extra slugs for payments not in the main list
const extraPmSlugs: Record<string, string> = {
  "Google Pay": "google-pay",
  "PayTM": "paytm",
  "Faster Payments": "faster-payments",
  "Cash Deposit": "cash-deposit",
  "OPay": "opay",
  "Papara": "papara",
  "PayID": "payid",
  "Maya": "maya",
  "OVO": "ovo",
  "Dana": "dana",
  "PayNow": "paynow",
  "SPEI": "spei",
};

topCombos.forEach(({ coin, loc, pm }) => {
  const pmSlug = pmSlugMap[pm] || extraPmSlugs[pm] || pm.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const pmObj = paymentMethods.find(p => p.name === pm) || { name: pm, slug: pmSlug, desc: `a popular payment method in ${loc.name}` };
  const slug = `buy-${coin.slug}-${loc.slug}-${pmSlug}`;
  // Avoid duplicates
  if (comboPages.some(p => p.slug === slug)) return;
  comboPages.push({
    slug,
    title: `Buy ${coin.name} in ${loc.name} with ${pm}`,
    metaTitle: `Buy ${coin.name} in ${loc.name} with ${pm} | Best P2P Rates | TrustP2P`,
    metaDescription: `Buy ${coin.fullName} in ${loc.name} using ${pm}. Escrow-protected P2P trades, verified traders, best rates in ${loc.currency}. Trade safely on TrustP2P.`,
    h1: `Buy ${coin.name} in ${loc.name} with ${pm}`,
    intro: `Buy ${coin.fullName} in ${loc.name} using ${pm} on TrustP2P. Get the best ${coin.symbol}/${loc.currency} rates from verified local traders. Every trade is protected by our secure escrow system — your funds are always safe.`,
    action: "buy",
    coin: coin.name,
    coinSymbol: coin.symbol,
    location: loc.name,
    paymentMethod: pm,
    contentSections: buildContentSections(coin, loc, pmObj),
    faq: buildFAQ(coin, loc, pmObj),
    relatedLinks: buildRelatedLinks(coin, loc, pmObj),
    parentLinks: buildParentLinks(coin, loc, pmObj),
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

const pageMap = new Map<string, SEOPageData>();
allSEOPages.forEach(p => pageMap.set(p.slug, p));

export function getSEOPage(slug: string): SEOPageData | undefined {
  return pageMap.get(slug);
}

export function getAllSlugs(): string[] {
  return allSEOPages.map(p => p.slug);
}

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
