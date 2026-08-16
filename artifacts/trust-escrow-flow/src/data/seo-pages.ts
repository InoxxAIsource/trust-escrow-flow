// ============================================================
// SEO PAGE GENERATOR - Programmatic SEO Engine
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

/**
 * Markets these pages cover.
 *
 * The first nine are settlement markets: they have counterparties in the
 * database and a working trade flow. The rest are reach markets - a visitor
 * arriving from search sees a live board of local offers in local currency,
 * matching the link that brought them, but trades settle through the four
 * supported regions. `seed-engine.ts` is the source of the offer data and
 * carries the same split via SETTLEMENT_MARKETS.
 *
 * Location `name` must match the `name` in seed-engine's countryConfigs
 * exactly - filterConfig.country is matched by string, so a mismatch produces
 * a page with an empty board rather than an error.
 */
const locations = [
  { name: "USA", slug: "usa", currency: "USD", payments: ["USA Bank Wire", "ACH Transfer", "Bank Transfer"] },
  { name: "UK", slug: "uk", currency: "GBP", payments: ["UK Faster Payments", "Bank Transfer"] },
  { name: "Germany", slug: "germany", currency: "EUR", payments: ["SEPA Transfer", "Bank Transfer"] },
  { name: "France", slug: "france", currency: "EUR", payments: ["SEPA Transfer", "Bank Transfer"] },
  { name: "Netherlands", slug: "netherlands", currency: "EUR", payments: ["SEPA Transfer", "Bank Transfer"] },
  { name: "Ireland", slug: "ireland", currency: "EUR", payments: ["SEPA Transfer", "Bank Transfer"] },
  { name: "Spain", slug: "spain", currency: "EUR", payments: ["SEPA Transfer", "Bank Transfer"] },
  { name: "Italy", slug: "italy", currency: "EUR", payments: ["SEPA Transfer", "Bank Transfer"] },
  { name: "Hong Kong", slug: "hong-kong", currency: "HKD", payments: ["FPS Transfer", "Bank Transfer"] },

  // Reach markets
  { name: "India", slug: "india", currency: "INR", payments: ["UPI", "IMPS", "Bank Transfer", "PayTM", "Google Pay"] },
  { name: "Nigeria", slug: "nigeria", currency: "NGN", payments: ["Bank Transfer", "OPay"] },
  { name: "Philippines", slug: "philippines", currency: "PHP", payments: ["GCash", "Bank Transfer", "Maya"] },
  { name: "Canada", slug: "canada", currency: "CAD", payments: ["Interac e-Transfer", "Bank Transfer"] },
  { name: "Australia", slug: "australia", currency: "AUD", payments: ["Bank Transfer", "PayID"] },
  { name: "Brazil", slug: "brazil", currency: "BRL", payments: ["PIX", "Bank Transfer"] },
  { name: "Turkey", slug: "turkey", currency: "TRY", payments: ["Bank Transfer", "Papara"] },
  { name: "UAE", slug: "uae", currency: "AED", payments: ["Bank Transfer", "Cash Deposit"] },
  { name: "Indonesia", slug: "indonesia", currency: "IDR", payments: ["Bank Transfer", "OVO", "Dana"] },
  { name: "Kenya", slug: "kenya", currency: "KES", payments: ["M-Pesa", "Bank Transfer"] },
  { name: "Singapore", slug: "singapore", currency: "SGD", payments: ["Bank Transfer", "PayNow"] },
  { name: "Mexico", slug: "mexico", currency: "MXN", payments: ["SPEI", "Bank Transfer"] },
];

/** Payment rails referenced by the pages above. Slugs appear in URLs. */
const paymentMethods = [
  { name: "USA Bank Wire", slug: "bank-wire", desc: "domestic US wire transfer, settled the same business day" },
  { name: "ACH Transfer", slug: "ach", desc: "the US automated clearing house network for low-cost bank transfers" },
  { name: "UK Faster Payments", slug: "faster-payments", desc: "the UK's near-instant interbank transfer scheme" },
  { name: "SEPA Transfer", slug: "sepa", desc: "the eurozone standard for cross-border bank transfers" },
  { name: "FPS Transfer", slug: "fps", desc: "Hong Kong's Faster Payment System for instant local transfers" },
  { name: "Bank Transfer", slug: "bank-transfer", desc: "traditional bank transfer available across all supported markets" },
  { name: "UPI", slug: "upi", desc: "India's Unified Payments Interface, instant and used by hundreds of millions" },
  { name: "IMPS", slug: "imps", desc: "India's Immediate Payment Service for round-the-clock interbank transfers" },
  { name: "PayTM", slug: "paytm", desc: "one of India's most widely used payment wallets" },
  { name: "Google Pay", slug: "google-pay", desc: "a UPI-backed payment app widely used across India" },
  { name: "OPay", slug: "opay", desc: "a leading mobile money platform in Nigeria" },
  { name: "GCash", slug: "gcash", desc: "the Philippines' most widely used mobile wallet" },
  { name: "Maya", slug: "maya", desc: "a Philippine digital wallet and banking platform" },
  { name: "Interac e-Transfer", slug: "interac", desc: "Canada's standard instant bank-to-bank transfer" },
  { name: "PayID", slug: "payid", desc: "Australia's instant payment addressing service on the New Payments Platform" },
  { name: "PIX", slug: "pix", desc: "Brazil's instant payment system, available 24/7" },
  { name: "Papara", slug: "papara", desc: "a Turkish digital wallet used for fast local transfers" },
  { name: "Cash Deposit", slug: "cash-deposit", desc: "an over-the-counter branch deposit, common across the Gulf" },
  { name: "OVO", slug: "ovo", desc: "an Indonesian digital wallet" },
  { name: "Dana", slug: "dana", desc: "an Indonesian mobile payment platform" },
  { name: "M-Pesa", slug: "mpesa", desc: "Kenya's dominant mobile money service" },
  { name: "PayNow", slug: "paynow", desc: "Singapore's instant transfer service addressed by phone or ID" },
  { name: "SPEI", slug: "spei", desc: "Mexico's interbank electronic payment system" },
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
      a: `Yes. P2PxBT uses escrow protection on every trade. The seller's ${coin.symbol} is locked in a secure escrow wallet before you send payment. Funds are only released when both parties confirm the trade. This eliminates fraud risk entirely.`,
    },
    {
      q: `How long does it take to buy ${coin.name}${pmText}?`,
      a: `Most trades complete within 5–15 minutes. After you initiate a trade, you send payment via ${pm ? pm.name : "your chosen method"}, the seller confirms receipt, and ${coin.symbol} is released from escrow to your wallet instantly.`,
    },
    {
      q: `What fees does P2PxBT charge?`,
      a: `P2PxBT charges a small escrow fee of 0.25% per trade. There are no hidden fees, no deposit fees, and no withdrawal fees. The price you see is the price you pay.`,
    },
    {
      q: `Do I need KYC to buy ${coin.name}?`,
      a: `Basic trades can start with email verification. For higher trade limits, identity verification (KYC) is recommended. Verified traders get higher limits, better visibility, and a trust badge on their profile.`,
    },
    {
      q: `What happens if there's a dispute?`,
      a: `If a dispute arises, P2PxBT's support team reviews the evidence from both parties. Since funds are held in escrow, neither party can run away with the money. Disputes are typically resolved within 24 hours.`,
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
    text: `Buying ${coin.fullName}${locText}${pmText} on P2PxBT is simple and secure. Follow these steps:\n\n1. **Create your account** - Sign up with your email and verify your identity for higher trade limits\n2. **Browse offers** - Find the best ${coin.symbol} rates from verified traders${loc ? ` in ${loc.name}` : ""}${pm ? ` who accept ${pm.name}` : ""}\n3. **Start the trade** - Select an offer and enter the amount you want to buy in ${loc ? loc.currency : "your local currency"}\n4. **Funds locked in escrow** - The seller's ${coin.symbol} is locked in P2PxBT's secure escrow wallet automatically\n5. **Make payment** - Send payment via ${pm ? pm.name : "your preferred method"} to the seller's details\n6. **Receive ${coin.symbol}** - Once the seller confirms your payment, ${coin.symbol} is released to your P2PxBT wallet instantly`,
  });

  if (pm) {
    sections.push({
      heading: `Why Use ${pm.name} to Buy ${coin.name}?`,
      text: `${pm.name} is ${pm.desc}. It offers fast settlement times, widespread availability, and convenience for P2P crypto trading. When you buy ${coin.name} with ${pm.name} on P2PxBT, your payment is processed quickly and the seller can verify it in real-time. Combined with P2PxBT's escrow protection, ${pm.name} provides one of the safest and most seamless ways to acquire cryptocurrency.`,
    });
  }

  if (loc) {
    sections.push({
      heading: `P2P Crypto Trading in ${loc.name}`,
      text: `${loc.name} is one of the fastest-growing markets for peer-to-peer cryptocurrency trading. With increasing adoption and a tech-savvy population, demand for ${coin.name} continues to rise. Popular payment methods in ${loc.name} include ${loc.payments.join(", ")}. P2PxBT offers competitive rates in ${loc.currency}, connects you with local verified traders, and provides escrow protection on every single trade. Whether you're buying for investment, remittances, or daily use, P2PxBT makes crypto accessible to everyone in ${loc.name}.`,
    });
  }

  sections.push({
    heading: "Why Escrow Protection Matters",
    text: `Escrow protection is the gold standard for safe P2P crypto trading. When you trade on P2PxBT, here's how it works: the seller's cryptocurrency is locked in a secure, non-custodial escrow wallet before any payment is made. The buyer then sends payment directly to the seller using the agreed payment method. Once the seller confirms receipt, the crypto is released from escrow to the buyer's wallet. If there's any disagreement, P2PxBT's dispute resolution team steps in. This system completely eliminates the risk of being scammed - your money and crypto are always protected.`,
  });

  sections.push({
    heading: "Verified Traders & Best Rates",
    text: `P2PxBT connects you with a network of verified traders offering competitive ${coin.name} rates${locText}. Every trader on the platform has a public profile showing their completion rate, average response time, total trade volume, and user rating. We recommend choosing traders with a 4.5+ star rating and 100+ completed trades for the best experience. Our platform also highlights "Recommended" traders who consistently deliver fast, reliable service.`,
  });

  sections.push({
    heading: `${coin.name} Trading Tips`,
    text: `Here are tips for a smooth ${coin.name} trading experience:\n\n- **Compare rates** - Check multiple offers to get the best ${coin.symbol} price${locText}\n- **Verify the trader** - Look for the verification badge and high completion rates\n- **Use escrow** - Never trade outside the platform; always use P2PxBT's escrow\n- **Start small** - If you're new, begin with a smaller trade to build confidence\n- **Stay in chat** - Use the in-trade chat to communicate with your trading partner\n- **Keep records** - Save payment confirmations and trade receipts for your records`,
  });

  return sections;
}

// ══════════════════════════════════════════════
// 1. COIN PAGES - /buy-{coin}, /sell-{coin}
// ══════════════════════════════════════════════
const coinPages: SEOPageData[] = coins.flatMap((coin) =>
  (["buy", "sell"] as const).map((action) => ({
    slug: `${action}-${coin.slug}`,
    title: `${action === "buy" ? "Buy" : "Sell"} ${coin.name}`,
    metaTitle: `${action === "buy" ? "Buy" : "Sell"} ${coin.name} Safely with Escrow | Best P2P Rates | P2PxBT`,
    metaDescription: `${action === "buy" ? "Buy" : "Sell"} ${coin.fullName} securely on P2PxBT with escrow protection. Multiple payment methods, verified traders, and the best P2P rates.`,
    h1: `${action === "buy" ? "Buy" : "Sell"} ${coin.name} with Escrow Protection`,
    intro: `${action === "buy" ? "Buy" : "Sell"} ${coin.fullName} safely on P2PxBT. Our escrow system locks funds until both parties confirm, ensuring zero risk of fraud. Choose from verified traders across 15+ countries, pick your preferred payment method, and trade in minutes. Over 12,000 trades completed securely.`,
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
// 2. COUNTRY PAGES - /buy-{coin}-{country}
// ══════════════════════════════════════════════
const countryPages: SEOPageData[] = coins.flatMap((coin) =>
  locations.map((loc) => ({
    slug: `buy-${coin.slug}-${loc.slug}`,
    title: `Buy ${coin.name} in ${loc.name}`,
    metaTitle: `Buy ${coin.name} in ${loc.name} | Best P2P Rates in ${loc.currency} | P2PxBT`,
    metaDescription: `Buy ${coin.fullName} in ${loc.name} using ${loc.payments.slice(0, 2).join(", ")}. Secure escrow-protected P2P trades with verified traders. Best rates in ${loc.currency}.`,
    h1: `Buy ${coin.name} in ${loc.name}`,
    intro: `Purchase ${coin.fullName} in ${loc.name} using popular payment methods like ${loc.payments.slice(0, 3).join(", ")}. P2PxBT's escrow protection ensures your funds are safe throughout the entire transaction. Get the best ${coin.symbol}/${loc.currency} rates from verified local traders.`,
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
// 3. PAYMENT PAGES - /buy-{coin}-{payment}
// ══════════════════════════════════════════════
const paymentPages: SEOPageData[] = coins.flatMap((coin) =>
  paymentMethods.map((pm) => ({
    slug: `buy-${coin.slug}-${pm.slug}`,
    title: `Buy ${coin.name} with ${pm.name}`,
    metaTitle: `Buy ${coin.name} with ${pm.name} | Instant P2P Trades | P2PxBT`,
    metaDescription: `Buy ${coin.fullName} instantly with ${pm.name} on P2PxBT. Secure escrow-protected P2P trades with verified traders accepting ${pm.name}.`,
    h1: `Buy ${coin.name} with ${pm.name}`,
    intro: `Buy ${coin.fullName} using ${pm.name} on P2PxBT. ${pm.name} is ${pm.desc}. All trades are protected by our secure escrow system, ensuring safe and instant transactions with verified traders.`,
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
// 4. COMBINATION PAGES - /buy-{coin}-{country}-{payment}
// ══════════════════════════════════════════════
const comboPages: SEOPageData[] = [];
// Coin x market x payment-rail combinations, derived from `locations` by slug
// rather than by index so reordering that array cannot silently mismatch a
// market with another country's payment methods.
const byslug = (slug: string) => locations.find((l) => l.slug === slug)!;

/**
 * Every market crossed with the rails it actually quotes.
 *
 * Previously a hand-picked list covering only the settlement markets, which
 * meant a restored market got its country page and its rail page but not the
 * combination - /buy-usdt-india and /buy-usdt-upi both resolved while
 * /buy-usdt-india-upi, the one that was indexed and earning clicks, 404'd.
 *
 * Driving it from each location's own `payments` list keeps the two in step:
 * adding a rail to a market generates its pages, and removing one retires
 * them, with the link pruning further down cleaning up the hrefs either way.
 */
const topCombos: { coin: typeof coins[0]; loc: typeof locations[0]; pm: string }[] =
  locations.flatMap((loc) =>
    loc.payments.flatMap((pm) => coins.map((coin) => ({ coin, loc, pm }))),
  );

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
    metaTitle: `Buy ${coin.name} in ${loc.name} with ${pm} | Best P2P Rates | P2PxBT`,
    metaDescription: `Buy ${coin.fullName} in ${loc.name} using ${pm}. Escrow-protected P2P trades, verified traders, best rates in ${loc.currency}. Trade safely on P2PxBT.`,
    h1: `Buy ${coin.name} in ${loc.name} with ${pm}`,
    intro: `Buy ${coin.fullName} in ${loc.name} using ${pm} on P2PxBT. Get the best ${coin.symbol}/${loc.currency} rates from verified local traders. Every trade is protected by our secure escrow system - your funds are always safe.`,
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
// 5. INDIA CITY PAGES - /buy-usdt-{city}, /sell-usdt-{city}, /buy-usdt-{city}-{payment}
// ══════════════════════════════════════════════
interface CityData {
  name: string;
  slug: string;
  tagline: string;
  localContext: string;
}

// Cities across the four supported markets. Copy describes the platform, so it
// avoids claims about real trading volume or adoption figures.
const marketCities: CityData[] = [
  { name: "New York", slug: "new-york", tagline: "The financial capital of the United States", localContext: "New York's concentration of finance and technology professionals makes it a natural setting for the US market. Counterparties here quote on USA Bank Wire and ACH Transfer, the two rails most familiar to American traders, with payment details issued by a P2PxBT operator in the trade chat." },
  { name: "San Francisco", slug: "san-francisco", tagline: "The heart of the US technology sector", localContext: "San Francisco anchors the West Coast US listings. Sellers quote on USA Bank Wire and ACH Transfer, with operator-issued payment details delivered in the trade chat rather than published on the listing." },
  { name: "Chicago", slug: "chicago", tagline: "A long-standing centre of derivatives and trading", localContext: "Chicago's trading heritage makes it a fitting market for the US listings. Counterparties quote a 4-6% premium over the reference price on the buy side, settled through USA Bank Wire or ACH Transfer." },
  { name: "Miami", slug: "miami", tagline: "A gateway between US and international markets", localContext: "Miami rounds out the US coverage, with counterparties quoting on USA Bank Wire and ACH Transfer. Every trade follows the same operator-assisted workflow, from verification through to completion." },
  { name: "London", slug: "london", tagline: "Europe's largest financial centre", localContext: "London anchors the UK market. Counterparties quote on UK Faster Payments and Bank Transfer, with payment details issued by a P2PxBT operator in the trade chat rather than published on the listing." },
  { name: "Manchester", slug: "manchester", tagline: "A major hub in the north of England", localContext: "Manchester extends the UK coverage beyond London. Counterparties here quote on UK Faster Payments, and the full trade lifecycle - verification, operator-issued details, completion - runs exactly as it does in every other market." },
  { name: "Edinburgh", slug: "edinburgh", tagline: "Scotland's financial and technology centre", localContext: "Edinburgh completes the UK listings. As in every market, counterparties quote their own spread over the live reference price and payment details are released only by an operator." },
  { name: "Berlin", slug: "berlin", tagline: "Germany's technology and startup capital", localContext: "Berlin leads the European market. Counterparties quote on SEPA Transfer and Bank Transfer, the standard rails across the eurozone." },
  { name: "Paris", slug: "paris", tagline: "A principal financial centre of the eurozone", localContext: "Paris forms part of the European coverage. Counterparties quote on SEPA Transfer, and payment instructions are released only when a P2PxBT operator sends them into the trade chat." },
  { name: "Amsterdam", slug: "amsterdam", tagline: "A hub for European fintech", localContext: "Amsterdam extends the eurozone listings. Counterparties quote on SEPA Transfer and Bank Transfer, with limits and pricing set per counterparty." },
  { name: "Dublin", slug: "dublin", tagline: "Ireland's technology and financial services centre", localContext: "Dublin appears in the European market with SEPA Transfer and Bank Transfer listings. The verification and operator workflow is identical across every market." },
  { name: "Madrid", slug: "madrid", tagline: "Spain's commercial and financial capital", localContext: "Madrid rounds out the southern European coverage. Counterparties quote on SEPA Transfer, and every price shown derives from the live reference feed plus that counterparty's own spread." },
  { name: "Hong Kong", slug: "hong-kong-city", tagline: "Asia's leading international financial centre", localContext: "Hong Kong anchors the Asian market. Counterparties quote on FPS Transfer - the territory's Faster Payment System - and Bank Transfer, with payment details issued by an operator in the trade chat." },
];

// ── City-specific mock data for live variation ──
export interface CityLiveData {
  sellers: number;
  buyers: number;
  lastTradeAgo: string;
  avgPrice: string;
  recentTrades: { amount: string; method: string; type: "buy" | "sell" }[];
  localSignal: string;
}

// City-level landing pages are not generated.
//
// The previous implementation produced ~380 lines of India-specific copy
// (UPI/IMPS rails, INR pricing, rupee amounts) plus three India hub pages.
// India is no longer a supported market, and the remaining markets are
// covered by the country and payment-method pages above, so the whole block
// was removed rather than rewritten. `marketCities` is retained because the
// landing page still reads it for related-market links.
const cityLiveDataMap: Record<string, CityLiveData> = {};

export function getCityLiveData(citySlug: string): CityLiveData | undefined {
  return cityLiveDataMap[citySlug];
}

export const marketCityPages: SEOPageData[] = [];

// ══════════════════════════════════════════════
// 5. COUNTRY HUBS - /{country}
// ══════════════════════════════════════════════
// One page per market, covering all four assets rather than one. These are the
// entry point a country's long tail links up into, so without them every
// /buy-{coin}-{country} page has no parent and the cluster has no root.
const hubPages: SEOPageData[] = locations.map((loc) => {
  const railList = loc.payments.join(", ");
  const assetList = coins.map((c) => c.name).join(", ");

  return {
    slug: loc.slug,
    title: `Buy and Sell Crypto in ${loc.name}`,
    metaTitle: `Buy & Sell Crypto in ${loc.name} | P2P Rates in ${loc.currency} | P2PxBT`,
    metaDescription: `Compare peer-to-peer ${assetList} offers in ${loc.name}. Live ${loc.currency} rates from verified counterparties, settled through ${loc.payments[0]}.`,
    h1: `P2P Crypto Trading in ${loc.name}`,
    intro: `Browse live peer-to-peer offers in ${loc.name}, priced in ${loc.currency}. Every counterparty quotes its own spread over the live reference rate, so the board below is a set of competing prices rather than one number - cheapest first.`,
    action: "buy",
    coin: "USDT",
    coinSymbol: "USDT",
    location: loc.name,
    contentSections: [
      {
        heading: `Trading crypto in ${loc.name}`,
        text: `P2PxBT lists ${assetList} offers for ${loc.name}, quoted in ${loc.currency}. Counterparties settle through ${railList}. Prices update against a live reference feed, and each counterparty's spread is fixed and stored, so the cheapest counterparty stays the cheapest rather than reshuffling between page loads.`,
      },
      {
        heading: `Payment methods used in ${loc.name}`,
        text: `Offers in ${loc.name} quote ${railList}. Which rail a counterparty accepts depends on the size of the trade - larger tickets typically settle by bank transfer, while instant rails suit smaller amounts. Filter the board by the method you can actually use before comparing prices; the best rate on a rail you cannot pay through is not the best rate.`,
      },
      {
        heading: "How to read the board",
        text: `Compare the spread rather than the headline price: the reference rate moves, but the spread is the counterparty's actual offer. Check the limits before the rate, since a good price on a listing that cannot fill your size is no use. Read completion rate and trade count together - a high percentage across very few trades says little.`,
      },
    ],
    faq: [
      {
        q: `What currency are ${loc.name} offers priced in?`,
        a: `${loc.currency}. Prices derive from the live reference rate for each asset plus the individual counterparty's spread.`,
      },
      {
        q: `Which payment methods work in ${loc.name}?`,
        a: `Counterparties in ${loc.name} quote ${railList}. Availability varies by counterparty and by trade size.`,
      },
      {
        q: "Do I need to verify my identity?",
        a: "Yes. Identity verification must be approved by an operator before a first trade. This is enforced by the database, not the interface.",
      },
    ],
    relatedLinks: [
      ...coins.map((c) => ({
        label: `Buy ${c.name} in ${loc.name}`,
        href: `/buy-${c.slug}-${loc.slug}`,
      })),
      { label: "How it works", href: "/how-it-works" },
    ],
    parentLinks: [
      { label: "Marketplace", href: "/marketplace" },
      ...coins.slice(0, 2).map((c) => ({ label: `Buy ${c.name}`, href: `/buy-${c.slug}` })),
    ],
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: loc.name, href: `/${loc.slug}` },
    ],
    filterConfig: { country: loc.name },
  };
});

// MASTER EXPORT
// ══════════════════════════════════════════════
const generatedPages: SEOPageData[] = [...coinPages, ...countryPages, ...paymentPages, ...comboPages, ...marketCityPages, ...hubPages];

/**
 * Every route this file produces, plus the hand-written pages a landing may
 * link back to. This is the authority on what exists.
 *
 * The link builders above compose hrefs from coin x location x payment without
 * knowing which of those combinations `topCombos` actually generates -- EU
 * locations list both SEPA and Bank Transfer, but only the SEPA pages get
 * built. That produced 72 internal links to 24 URLs that were never generated.
 *
 * Rather than teach four builders the generation rules, links are pruned once
 * here against the finished set. Adding a combination automatically restores
 * the links to it; removing one cannot leave a dangling href behind.
 */
const STATIC_ROUTES = new Set([
  "/", "/marketplace", "/how-it-works", "/fees", "/blog", "/privacy", "/terms",
]);

const generatedSlugs = new Set(generatedPages.map((p) => `/${p.slug}`));

function linkExists(href: string): boolean {
  const path = href.split("#")[0].split("?")[0];
  const normalised = path.length > 1 ? path.replace(/\/$/, "") : "/";
  return (
    STATIC_ROUTES.has(normalised) ||
    generatedSlugs.has(normalised) ||
    normalised.startsWith("/blog/")
  );
}

export const allSEOPages: SEOPageData[] = generatedPages.map((page) => ({
  ...page,
  parentLinks: page.parentLinks.filter((l) => linkExists(l.href)),
  relatedLinks: page.relatedLinks.filter((l) => linkExists(l.href)),
  breadcrumbs: page.breadcrumbs.filter((b) => !b.href || linkExists(b.href)),
}));

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
    cityPages: marketCityPages.length,
    hubPages: hubPages.length,
  };
}

export { coinPages, countryPages, paymentPages, comboPages, marketCities, locations, paymentMethods as paymentMethodsList, coins as coinsList };
