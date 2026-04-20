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
    text: `Buying ${coin.fullName}${locText}${pmText} on P2PxBT is simple and secure. Follow these steps:\n\n1. **Create your account** — Sign up with your email and verify your identity for higher trade limits\n2. **Browse offers** — Find the best ${coin.symbol} rates from verified traders${loc ? ` in ${loc.name}` : ""}${pm ? ` who accept ${pm.name}` : ""}\n3. **Start the trade** — Select an offer and enter the amount you want to buy in ${loc ? loc.currency : "your local currency"}\n4. **Funds locked in escrow** — The seller's ${coin.symbol} is locked in P2PxBT's secure escrow wallet automatically\n5. **Make payment** — Send payment via ${pm ? pm.name : "your preferred method"} to the seller's details\n6. **Receive ${coin.symbol}** — Once the seller confirms your payment, ${coin.symbol} is released to your P2PxBT wallet instantly`,
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
    text: `Escrow protection is the gold standard for safe P2P crypto trading. When you trade on P2PxBT, here's how it works: the seller's cryptocurrency is locked in a secure, non-custodial escrow wallet before any payment is made. The buyer then sends payment directly to the seller using the agreed payment method. Once the seller confirms receipt, the crypto is released from escrow to the buyer's wallet. If there's any disagreement, P2PxBT's dispute resolution team steps in. This system completely eliminates the risk of being scammed — your money and crypto are always protected.`,
  });

  sections.push({
    heading: "Verified Traders & Best Rates",
    text: `P2PxBT connects you with a network of verified traders offering competitive ${coin.name} rates${locText}. Every trader on the platform has a public profile showing their completion rate, average response time, total trade volume, and user rating. We recommend choosing traders with a 4.5+ star rating and 100+ completed trades for the best experience. Our platform also highlights "Recommended" traders who consistently deliver fast, reliable service.`,
  });

  sections.push({
    heading: `${coin.name} Trading Tips`,
    text: `Here are tips for a smooth ${coin.name} trading experience:\n\n- **Compare rates** — Check multiple offers to get the best ${coin.symbol} price${locText}\n- **Verify the trader** — Look for the verification badge and high completion rates\n- **Use escrow** — Never trade outside the platform; always use P2PxBT's escrow\n- **Start small** — If you're new, begin with a smaller trade to build confidence\n- **Stay in chat** — Use the in-trade chat to communicate with your trading partner\n- **Keep records** — Save payment confirmations and trade receipts for your records`,
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
// 2. COUNTRY PAGES — /buy-{coin}-{country}
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
// 3. PAYMENT PAGES — /buy-{coin}-{payment}
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
    metaTitle: `Buy ${coin.name} in ${loc.name} with ${pm} | Best P2P Rates | P2PxBT`,
    metaDescription: `Buy ${coin.fullName} in ${loc.name} using ${pm}. Escrow-protected P2P trades, verified traders, best rates in ${loc.currency}. Trade safely on P2PxBT.`,
    h1: `Buy ${coin.name} in ${loc.name} with ${pm}`,
    intro: `Buy ${coin.fullName} in ${loc.name} using ${pm} on P2PxBT. Get the best ${coin.symbol}/${loc.currency} rates from verified local traders. Every trade is protected by our secure escrow system — your funds are always safe.`,
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
// 5. INDIA CITY PAGES — /buy-usdt-{city}, /sell-usdt-{city}, /buy-usdt-{city}-{payment}
// ══════════════════════════════════════════════
interface CityData {
  name: string;
  slug: string;
  tagline: string;
  localContext: string;
}

const indianCities: CityData[] = [
  { name: "Delhi", slug: "delhi", tagline: "India's capital and a major crypto trading hub", localContext: "Delhi's vibrant tech ecosystem and large population of young professionals make it one of the top cities for P2P crypto trading in India. With widespread UPI adoption through apps like Google Pay, PhonePe, and Paytm, Delhi traders enjoy instant INR payments. Major banks like SBI, HDFC, and ICICI have branches across the city, making bank transfers equally convenient." },
  { name: "Mumbai", slug: "mumbai", tagline: "India's financial capital with the highest crypto trading volume", localContext: "As India's financial hub and home to the Bombay Stock Exchange, Mumbai has a tech-savvy population that embraces crypto trading. UPI transactions in Mumbai are among the highest in India, and the city's well-connected banking infrastructure makes both UPI and bank transfers seamless for USDT trading." },
  { name: "Bangalore", slug: "bangalore", tagline: "India's Silicon Valley and a tech-driven crypto market", localContext: "Bangalore's massive IT workforce and startup culture make it a natural hotspot for cryptocurrency adoption. Engineers, freelancers, and entrepreneurs in Bangalore actively trade USDT for cross-border payments, freelance income, and investment. UPI is the dominant payment method here, with near-universal adoption among the tech community." },
  { name: "Chennai", slug: "chennai", tagline: "South India's gateway to crypto trading", localContext: "Chennai's growing IT corridor and manufacturing sector have driven increasing demand for USDT trading. The city's educated workforce is comfortable with digital payments — UPI usage has surged here, and traditional bank transfers through Indian Bank, IOB, and other local institutions remain popular for larger transactions." },
  { name: "Kolkata", slug: "kolkata", tagline: "Eastern India's emerging crypto trading center", localContext: "Kolkata's evolving fintech landscape has seen rapid growth in P2P crypto adoption. With affordable internet and increasing smartphone penetration, UPI usage in Kolkata has grown exponentially. Local traders appreciate the convenience of instant INR payments for USDT purchases, making it one of the fastest-growing crypto markets in eastern India." },
  { name: "Hyderabad", slug: "hyderabad", tagline: "The City of Pearls meets digital assets", localContext: "Hyderabad's booming IT sector, anchored by HITEC City, has created a large base of tech professionals who trade USDT regularly. The city's strong banking presence and high UPI adoption rate make it easy for traders to buy and sell USDT quickly. Many Hyderabad traders use crypto for international freelancing payments and remittances." },
  { name: "Pune", slug: "pune", tagline: "India's Oxford City embraces crypto innovation", localContext: "Pune's unique blend of educational institutions and IT companies has created a young, tech-literate population that actively participates in crypto trading. The city's startup ecosystem drives demand for USDT, and widespread UPI adoption through PhonePe (headquartered nearby) makes instant payments the norm for P2P trades." },
  { name: "Gurgaon", slug: "gurgaon", tagline: "The Millennium City's fast-paced crypto market", localContext: "Gurgaon (Gurugram) is home to numerous multinational corporations and fintech companies, creating a population that's highly comfortable with digital finance. USDT trading volumes in Gurgaon are among the highest per capita in India. UPI and instant bank transfers through major private banks like HDFC and ICICI are the preferred payment methods." },
  { name: "Noida", slug: "noida", tagline: "NCR's tech corridor for digital asset trading", localContext: "Noida's IT parks and proximity to Delhi make it a significant hub for crypto traders in the NCR region. The city's young demographic and high internet penetration drive strong demand for USDT. Local traders favor UPI for its speed, while bank transfers through nationalized banks handle larger transactions efficiently." },
  { name: "Lucknow", slug: "lucknow", tagline: "UP's capital enters the digital asset era", localContext: "Lucknow's rapidly growing digital economy has seen increasing crypto adoption. With government push for digital payments and growing UPI penetration in tier-2 cities, Lucknow traders can now easily buy USDT using familiar payment methods. The city's young student population and emerging IT sector drive consistent trading demand." },
  { name: "Jaipur", slug: "jaipur", tagline: "The Pink City goes digital with crypto trading", localContext: "Jaipur's entrepreneurial spirit and growing IT presence have fueled crypto adoption in Rajasthan's capital. Local traders — including jewelry merchants, textile exporters, and tech professionals — use USDT for international transactions. UPI adoption is high, and the city's established banking network supports smooth P2P trading." },
  { name: "Ahmedabad", slug: "ahmedabad", tagline: "Gujarat's commercial hub for crypto exchange", localContext: "Ahmedabad's strong business community and textile industry have driven USDT adoption for international trade settlements. The city's merchants use crypto to streamline cross-border payments. With Gujarat's high digital literacy and widespread UPI usage, buying USDT in Ahmedabad is fast, safe, and convenient." },
  { name: "Kochi", slug: "kochi", tagline: "Kerala's port city connects to global crypto markets", localContext: "Kochi's status as a major IT hub (InfoPark, SmartCity) and its large NRI population make it a natural market for USDT trading. Many Kochi residents use USDT for remittances and international payments. Kerala's high literacy rate translates to strong digital payment adoption, with UPI being the go-to method for P2P crypto trades." },
  { name: "Dehradun", slug: "dehradun", tagline: "Uttarakhand's capital embraces P2P crypto", localContext: "Dehradun's growing IT sector and educational institutions have created a small but active crypto trading community. With the city's increasing digital connectivity and UPI adoption, buying USDT in Dehradun is now as easy as in major metros. Local traders appreciate the escrow protection that eliminates the risks of peer-to-peer trading." },
];

export const indianCityPages: SEOPageData[] = [];

// ── City-specific mock data for live variation ──
export interface CityLiveData {
  sellers: number;
  buyers: number;
  lastTradeAgo: string;
  avgPrice: string;
  recentTrades: { amount: string; method: string; type: "buy" | "sell" }[];
  localSignal: string;
}

const cityLiveDataMap: Record<string, CityLiveData> = {
  delhi: { sellers: 12, buyers: 9, lastTradeAgo: "2 mins ago", avgPrice: "₹89.8", recentTrades: [{ amount: "₹25,000", method: "UPI", type: "buy" }, { amount: "₹10,000", method: "Bank Transfer", type: "sell" }, { amount: "₹50,000", method: "UPI", type: "buy" }], localSignal: "In Delhi NCR, UPI dominates P2P crypto trades with 78% of all transactions. Delhi traders typically complete trades in under 8 minutes." },
  mumbai: { sellers: 18, buyers: 14, lastTradeAgo: "1 min ago", avgPrice: "₹90.1", recentTrades: [{ amount: "₹1,00,000", method: "Bank Transfer", type: "buy" }, { amount: "₹15,000", method: "UPI", type: "sell" }, { amount: "₹35,000", method: "UPI", type: "buy" }], localSignal: "Mumbai traders prefer bank transfer for large trades above ₹50,000, while UPI handles the high volume of smaller daily transactions." },
  bangalore: { sellers: 15, buyers: 11, lastTradeAgo: "3 mins ago", avgPrice: "₹89.5", recentTrades: [{ amount: "₹40,000", method: "UPI", type: "buy" }, { amount: "₹75,000", method: "Bank Transfer", type: "buy" }, { amount: "₹20,000", method: "UPI", type: "sell" }], localSignal: "UPI is dominant in Bangalore — 85% of crypto traders here use Google Pay or PhonePe for instant INR settlements." },
  chennai: { sellers: 9, buyers: 7, lastTradeAgo: "5 mins ago", avgPrice: "₹89.9", recentTrades: [{ amount: "₹12,000", method: "UPI", type: "buy" }, { amount: "₹8,000", method: "Bank Transfer", type: "sell" }, { amount: "₹30,000", method: "UPI", type: "buy" }], localSignal: "Chennai's IT corridor traders are most active between 6 PM–11 PM IST, with UPI being the preferred payment for quick settlements." },
  kolkata: { sellers: 8, buyers: 6, lastTradeAgo: "7 mins ago", avgPrice: "₹90.3", recentTrades: [{ amount: "₹5,000", method: "UPI", type: "buy" }, { amount: "₹18,000", method: "Bank Transfer", type: "buy" }, { amount: "₹7,500", method: "UPI", type: "sell" }], localSignal: "Kolkata's P2P crypto market is growing 40% quarter-over-quarter, with most traders preferring UPI for its zero-fee instant transfers." },
  hyderabad: { sellers: 11, buyers: 8, lastTradeAgo: "4 mins ago", avgPrice: "₹89.7", recentTrades: [{ amount: "₹22,000", method: "UPI", type: "buy" }, { amount: "₹60,000", method: "Bank Transfer", type: "buy" }, { amount: "₹15,000", method: "UPI", type: "sell" }], localSignal: "HITEC City professionals in Hyderabad drive significant USDT demand, especially for freelance payments from international clients." },
  pune: { sellers: 7, buyers: 5, lastTradeAgo: "6 mins ago", avgPrice: "₹89.6", recentTrades: [{ amount: "₹10,000", method: "UPI", type: "buy" }, { amount: "₹25,000", method: "UPI", type: "buy" }, { amount: "₹12,000", method: "Bank Transfer", type: "sell" }], localSignal: "Pune's student and startup community drives steady USDT trading volume, with PhonePe (headquartered nearby) being the top UPI app used." },
  gurgaon: { sellers: 10, buyers: 8, lastTradeAgo: "3 mins ago", avgPrice: "₹89.9", recentTrades: [{ amount: "₹45,000", method: "Bank Transfer", type: "buy" }, { amount: "₹20,000", method: "UPI", type: "buy" }, { amount: "₹35,000", method: "UPI", type: "sell" }], localSignal: "Gurgaon's fintech professionals trade USDT in high volumes — average trade size here is 2x the national average." },
  noida: { sellers: 8, buyers: 6, lastTradeAgo: "5 mins ago", avgPrice: "₹90.0", recentTrades: [{ amount: "₹15,000", method: "UPI", type: "buy" }, { amount: "₹30,000", method: "Bank Transfer", type: "buy" }, { amount: "₹8,000", method: "UPI", type: "sell" }], localSignal: "Noida's IT sector employees are increasingly using USDT for freelance payments, with UPI enabling instant INR conversions." },
  lucknow: { sellers: 5, buyers: 4, lastTradeAgo: "10 mins ago", avgPrice: "₹90.4", recentTrades: [{ amount: "₹8,000", method: "UPI", type: "buy" }, { amount: "₹12,000", method: "Bank Transfer", type: "buy" }, { amount: "₹5,000", method: "UPI", type: "sell" }], localSignal: "Lucknow's crypto trading community is growing rapidly, driven by the city's expanding IT sector and digital-first student population." },
  jaipur: { sellers: 6, buyers: 4, lastTradeAgo: "8 mins ago", avgPrice: "₹90.2", recentTrades: [{ amount: "₹20,000", method: "Bank Transfer", type: "buy" }, { amount: "₹7,000", method: "UPI", type: "buy" }, { amount: "₹15,000", method: "UPI", type: "sell" }], localSignal: "Jaipur's gem and textile merchants are among the earliest USDT adopters for international trade settlements." },
  ahmedabad: { sellers: 7, buyers: 5, lastTradeAgo: "6 mins ago", avgPrice: "₹90.1", recentTrades: [{ amount: "₹30,000", method: "Bank Transfer", type: "buy" }, { amount: "₹10,000", method: "UPI", type: "buy" }, { amount: "₹18,000", method: "UPI", type: "sell" }], localSignal: "Gujarat's entrepreneurial culture drives strong USDT adoption in Ahmedabad, especially among export-oriented businesses." },
  kochi: { sellers: 5, buyers: 4, lastTradeAgo: "9 mins ago", avgPrice: "₹90.0", recentTrades: [{ amount: "₹15,000", method: "UPI", type: "buy" }, { amount: "₹25,000", method: "Bank Transfer", type: "buy" }, { amount: "₹10,000", method: "UPI", type: "sell" }], localSignal: "Kochi's large NRI community uses USDT for fast, low-cost international remittances back to Kerala." },
  dehradun: { sellers: 3, buyers: 2, lastTradeAgo: "15 mins ago", avgPrice: "₹90.5", recentTrades: [{ amount: "₹5,000", method: "UPI", type: "buy" }, { amount: "₹8,000", method: "UPI", type: "buy" }, { amount: "₹3,000", method: "Bank Transfer", type: "sell" }], localSignal: "Dehradun's growing tech community and educational institutions are driving steady growth in P2P USDT trading." },
};

export function getCityLiveData(citySlug: string): CityLiveData | undefined {
  return cityLiveDataMap[citySlug];
}

const usdt = coins[0]; // USDT

indianCities.forEach((city, idx) => {
  // 3 related cities + 2 payment links + 1 hub link
  const related1 = indianCities[(idx + 1) % indianCities.length];
  const related2 = indianCities[(idx + 3) % indianCities.length];
  const related3 = indianCities[(idx + 5) % indianCities.length];

  const cityRelatedLinks = [
    { label: "Buy USDT in India (All Cities)", href: "/buy-usdt-india" },
    { label: `Buy USDT in ${related1.name}`, href: `/buy-usdt-${related1.slug}` },
    { label: `Buy USDT in ${related2.name}`, href: `/buy-usdt-${related2.slug}` },
    { label: `Buy USDT in ${related3.name}`, href: `/buy-usdt-${related3.slug}` },
    { label: "Buy USDT with UPI", href: "/buy-usdt-upi" },
    { label: "Buy USDT via Bank Transfer", href: "/buy-usdt-bank-transfer" },
    { label: `Sell USDT in ${city.name}`, href: `/sell-usdt-${city.slug}` },
    { label: "Sell USDT in India", href: "/sell-usdt-india" },
  ];

  const cityParentLinks = [
    { label: "Home", href: "/" },
    { label: "Buy USDT", href: "/buy-usdt" },
    { label: "Buy USDT in India", href: "/buy-usdt-india" },
  ];

  const buildCityContent = (action: "buy" | "sell", pm?: string): { sections: { heading: string; text: string }[]; faq: { q: string; a: string }[] } => {
    const pmText = pm ? ` using ${pm}` : "";
    const actionWord = action === "buy" ? "Buy" : "Sell";

    const sections: { heading: string; text: string }[] = [
      {
        heading: `${actionWord} USDT in ${city.name} — Overview`,
        text: `${city.name} is ${city.tagline}. P2PxBT makes it easy to ${action} USDT (Tether) in ${city.name}${pmText} with full escrow protection. Whether you're a student, freelancer, business owner, or investor in ${city.name}, you can trade USDT safely and instantly on our platform. All transactions are in INR, and we support popular Indian payment methods including UPI, IMPS, and bank transfer.`,
      },
      {
        heading: `Local Trading in ${city.name}`,
        text: city.localContext,
      },
      {
        heading: `How to ${actionWord} USDT in ${city.name}${pmText}`,
        text: `Follow these simple steps to ${action} USDT in ${city.name}:\n\n1. **Create your P2PxBT account** — Sign up with your email and complete basic verification\n2. **Browse ${city.name} offers** — Find verified traders offering the best USDT/INR rates${pm ? ` who accept ${pm}` : ""}\n3. **Start a trade** — Enter the amount of USDT you want to ${action} and confirm the trade\n4. **Escrow protection activates** — The ${action === "buy" ? "seller's USDT is locked" : "USDT is locked"} in our secure escrow wallet\n5. **${action === "buy" ? "Send payment" : "Receive payment"}** — ${action === "buy" ? `Pay the seller via ${pm || "UPI or bank transfer"}` : `The buyer sends payment via ${pm || "UPI or bank transfer"}`}\n6. **${action === "buy" ? "Receive USDT" : "Release USDT"}** — Once ${action === "buy" ? "payment is confirmed, USDT is released to your wallet" : "you confirm payment receipt, USDT is released from escrow"}`,
      },
      {
        heading: `Current USDT Price in ${city.name}`,
        text: `The USDT price in ${city.name} closely tracks the global USDT/INR rate, typically trading between ₹83–₹88 depending on market demand and supply. P2P platforms like P2PxBT often offer rates that are 1–3% above the global rate due to local demand. Prices on our platform update every 30 seconds to reflect real-time market conditions. Check the live price widget above for the current rate.`,
      },
      {
        heading: `Why Choose P2PxBT for ${city.name}?`,
        text: `P2PxBT stands out as the safest way to trade USDT in ${city.name}:\n\n- **Escrow protection** — Every trade is secured. No one can run away with your money\n- **Fast release** — Trades complete in 5–15 minutes on average\n- **Verified sellers** — All traders are verified with ratings and trade history visible\n- **Local payment methods** — Pay with UPI, IMPS, or bank transfer in INR\n- **24/7 trading** — Buy or sell USDT any time, day or night\n- **Dispute resolution** — Our team resolves any issues within 24 hours`,
      },
    ];

    if (pm) {
      sections.push({
        heading: `Using ${pm} for USDT Trading in ${city.name}`,
        text: `${pm} is one of the most popular payment methods for buying USDT in ${city.name}. ${pm === "UPI" ? "UPI enables instant bank-to-bank transfers 24/7 with zero fees, making it perfect for P2P crypto trades. Simply scan the seller's QR code or enter their UPI ID to send payment instantly." : "Bank transfers in India are reliable and support higher transaction limits. NEFT, RTGS, and IMPS transfers are all accepted by P2PxBT traders, giving you flexibility based on your transfer amount and urgency."} When combined with P2PxBT's escrow protection, ${pm} offers the fastest and safest way to acquire USDT in ${city.name}.`,
      });
    }

    sections.push({
      heading: `USDT Trading Tips for ${city.name} Traders`,
      text: `Here are tips for a smooth USDT trading experience in ${city.name}:\n\n- **Compare rates** — Check multiple offers to find the best USDT/INR rate\n- **Verify the trader** — Look for the verification badge, high completion rates (95%+), and 100+ trades\n- **Use escrow** — Never trade outside P2PxBT; always use the platform's escrow system\n- **Start small** — Begin with a ₹500–₹1,000 trade to build confidence\n- **Keep payment proof** — Screenshot your UPI/bank transfer confirmation\n- **Stay responsive** — Reply quickly in the trade chat for faster completion`,
    });

    const faq: { q: string; a: string }[] = [
      { q: `Is it safe to buy USDT in ${city.name}?`, a: `Yes, absolutely. P2PxBT uses escrow protection on every trade. The seller's USDT is locked before you send payment, and it's only released when both parties confirm. This eliminates fraud risk completely.` },
      { q: `How fast can I buy USDT in ${city.name}?`, a: `Most trades complete within 5–15 minutes. UPI payments are instant, and sellers typically confirm receipt within minutes. Once confirmed, USDT is released to your wallet immediately.` },
      { q: `What payment methods can I use in ${city.name}?`, a: `You can use UPI (Google Pay, PhonePe, Paytm), IMPS, NEFT, RTGS, or bank transfer. UPI is the fastest and most popular method for USDT trading in ${city.name}.` },
      { q: `What is the minimum amount to trade?`, a: `You can start trading with as little as ₹500 worth of USDT. There's no maximum limit for verified traders.` },
      { q: `Do I need KYC to trade in ${city.name}?`, a: `Basic email verification gets you started. For higher trade limits and access to more features, completing identity verification is recommended.` },
    ];

    return { sections, faq };
  };

  // /buy-usdt-{city}
  const buyContent = buildCityContent("buy");
  indianCityPages.push({
    slug: `buy-usdt-${city.slug}`,
    title: `Buy USDT in ${city.name}`,
    metaTitle: `Buy USDT in ${city.name} | Instant P2P Crypto Exchange | P2PxBT`,
    metaDescription: `Buy USDT in ${city.name} using UPI or bank transfer. सुरक्षित और तेज़ crypto trading with escrow protection on P2PxBT.`,
    h1: `Buy USDT in ${city.name} Safely with Escrow`,
    intro: `Buy USDT in ${city.name} using secure escrow and local payment methods like UPI and bank transfer. P2PxBT connects you with verified local traders offering the best USDT/INR rates. Fast, safe, and trusted by thousands of traders across India.`,
    action: "buy",
    coin: "USDT",
    coinSymbol: "USDT",
    location: city.name,
    contentSections: buyContent.sections,
    faq: buyContent.faq,
    relatedLinks: cityRelatedLinks,
    parentLinks: cityParentLinks,
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Buy USDT", href: "/buy-usdt" },
      { label: "India", href: "/buy-usdt-india" },
      { label: city.name, href: `/buy-usdt-${city.slug}` },
    ],
    filterConfig: { asset: "USDT", country: "India", type: "buy" },
  });

  // /sell-usdt-{city}
  const sellContent = buildCityContent("sell");
  indianCityPages.push({
    slug: `sell-usdt-${city.slug}`,
    title: `Sell USDT in ${city.name}`,
    metaTitle: `Sell USDT in ${city.name} | Get INR Instantly | P2PxBT`,
    metaDescription: `Sell USDT in ${city.name} and receive INR via UPI or bank transfer. Fast escrow-protected P2P trades on P2PxBT.`,
    h1: `Sell USDT in ${city.name} — Get INR Instantly`,
    intro: `Sell your USDT in ${city.name} and receive INR directly to your bank account or UPI. P2PxBT's escrow protection ensures you get paid safely and quickly. Verified buyers, competitive rates, and instant payouts.`,
    action: "sell",
    coin: "USDT",
    coinSymbol: "USDT",
    location: city.name,
    contentSections: sellContent.sections,
    faq: sellContent.faq,
    relatedLinks: [
      { label: "Buy USDT in India", href: "/buy-usdt-india" },
      { label: `Buy USDT in ${city.name}`, href: `/buy-usdt-${city.slug}` },
      { label: `Buy USDT in ${related1.name}`, href: `/buy-usdt-${related1.slug}` },
      { label: "Sell USDT", href: "/sell-usdt" },
      { label: "View Marketplace", href: "/marketplace" },
    ],
    parentLinks: [
      { label: "Home", href: "/" },
      { label: "Sell USDT", href: "/sell-usdt" },
    ],
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Sell USDT", href: "/sell-usdt" },
      { label: city.name, href: `/sell-usdt-${city.slug}` },
    ],
    filterConfig: { asset: "USDT", country: "India", type: "sell" },
  });

  // /buy-usdt-{city}-upi
  const upiContent = buildCityContent("buy", "UPI");
  indianCityPages.push({
    slug: `buy-usdt-${city.slug}-upi`,
    title: `Buy USDT in ${city.name} with UPI`,
    metaTitle: `Buy USDT in ${city.name} with UPI | Instant P2P Trades | P2PxBT`,
    metaDescription: `Buy USDT in ${city.name} using UPI. Instant INR payment, escrow-protected trades, verified sellers. Best USDT rates in ${city.name}.`,
    h1: `Buy USDT in ${city.name} with UPI`,
    intro: `Buy USDT in ${city.name} instantly using UPI — India's fastest payment method. Pay directly from Google Pay, PhonePe, or any UPI app. Every trade is escrow-protected and completes in under 10 minutes.`,
    action: "buy",
    coin: "USDT",
    coinSymbol: "USDT",
    location: city.name,
    paymentMethod: "UPI",
    contentSections: upiContent.sections,
    faq: upiContent.faq,
    relatedLinks: [
      ...cityRelatedLinks.slice(0, 3),
      { label: `Buy USDT in ${city.name} with Bank Transfer`, href: `/buy-usdt-${city.slug}-bank-transfer` },
      { label: "Buy USDT with UPI", href: "/buy-usdt-upi" },
      { label: "View Marketplace", href: "/marketplace" },
    ],
    parentLinks: [
      { label: "Home", href: "/" },
      { label: "Buy USDT", href: "/buy-usdt" },
      { label: "Buy USDT in India", href: "/buy-usdt-india" },
      { label: `Buy USDT in ${city.name}`, href: `/buy-usdt-${city.slug}` },
    ],
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Buy USDT", href: "/buy-usdt" },
      { label: city.name, href: `/buy-usdt-${city.slug}` },
      { label: "UPI", href: `/buy-usdt-${city.slug}-upi` },
    ],
    filterConfig: { asset: "USDT", country: "India", paymentMethod: "UPI", type: "buy" },
  });

  // /buy-usdt-{city}-bank-transfer
  const btContent = buildCityContent("buy", "Bank Transfer");
  indianCityPages.push({
    slug: `buy-usdt-${city.slug}-bank-transfer`,
    title: `Buy USDT in ${city.name} with Bank Transfer`,
    metaTitle: `Buy USDT in ${city.name} via Bank Transfer | Secure P2P | P2PxBT`,
    metaDescription: `Buy USDT in ${city.name} using bank transfer (NEFT/RTGS/IMPS). Escrow-protected P2P trades with verified sellers. Best INR rates.`,
    h1: `Buy USDT in ${city.name} with Bank Transfer`,
    intro: `Buy USDT in ${city.name} using NEFT, RTGS, or IMPS bank transfer. Ideal for larger transactions with higher limits. Every trade is protected by P2PxBT's secure escrow system.`,
    action: "buy",
    coin: "USDT",
    coinSymbol: "USDT",
    location: city.name,
    paymentMethod: "Bank Transfer",
    contentSections: btContent.sections,
    faq: btContent.faq,
    relatedLinks: [
      ...cityRelatedLinks.slice(0, 3),
      { label: `Buy USDT in ${city.name} with UPI`, href: `/buy-usdt-${city.slug}-upi` },
      { label: "Buy USDT with Bank Transfer", href: "/buy-usdt-bank-transfer" },
      { label: "View Marketplace", href: "/marketplace" },
    ],
    parentLinks: [
      { label: "Home", href: "/" },
      { label: "Buy USDT", href: "/buy-usdt" },
      { label: "Buy USDT in India", href: "/buy-usdt-india" },
      { label: `Buy USDT in ${city.name}`, href: `/buy-usdt-${city.slug}` },
    ],
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Buy USDT", href: "/buy-usdt" },
      { label: city.name, href: `/buy-usdt-${city.slug}` },
      { label: "Bank Transfer", href: `/buy-usdt-${city.slug}-bank-transfer` },
    ],
    filterConfig: { asset: "USDT", country: "India", paymentMethod: "Bank Transfer", type: "buy" },
  });
});

// ══════════════════════════════════════════════
// 6. SUPER HUB PAGES — Authority hubs that push link juice
// ══════════════════════════════════════════════
const hubPages: SEOPageData[] = [];

// A. /buy-usdt-india — Links to ALL 14 cities
const buyUsdtIndiaHub: SEOPageData = {
  slug: "buy-usdt-india",
  title: "Buy USDT in India",
  metaTitle: "Buy USDT in India | P2P Crypto Exchange in All Major Cities | P2PxBT",
  metaDescription: "Buy USDT in India using UPI or bank transfer. Trade in Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Pune & more. Escrow-protected P2P trades.",
  h1: "Buy USDT in India — All Major Cities",
  intro: "Buy USDT safely across India using UPI, IMPS, or bank transfer. P2PxBT connects you with verified local traders in 14 major cities. Every trade is escrow-protected — your funds are always safe. Choose your city below to find the best USDT/INR rates from traders near you.",
  action: "buy",
  coin: "USDT",
  coinSymbol: "USDT",
  location: "India",
  contentSections: [
    {
      heading: "Buy USDT in Any Indian City",
      text: indianCities.map(c => {
        const ld = cityLiveDataMap[c.slug];
        return `- **${c.name}** — ${ld.sellers} active sellers • Last trade: ${ld.lastTradeAgo} • Avg price: ${ld.avgPrice}`;
      }).join("\n"),
    },
    {
      heading: "Why Buy USDT in India on P2PxBT?",
      text: "India is one of the world's largest and fastest-growing markets for peer-to-peer cryptocurrency trading. With over 300 million UPI users and a tech-savvy population, buying USDT has never been easier. P2PxBT offers escrow-protected trades in INR, verified traders with public ratings, and support for all major Indian payment methods including UPI, IMPS, NEFT, RTGS, and bank transfer. Whether you're in Delhi, Mumbai, Bangalore, or any other city, you can buy USDT in minutes.",
    },
    {
      heading: "Supported Payment Methods",
      text: "P2PxBT supports all popular Indian payment methods for USDT trading:\n\n- **UPI** — Instant payments via Google Pay, PhonePe, Paytm, and any UPI app. Zero fees, 24/7 availability.\n- **IMPS** — Immediate Payment Service for instant bank-to-bank transfers up to ₹5 lakh.\n- **Bank Transfer (NEFT/RTGS)** — For larger transactions. NEFT settles in batches, RTGS is real-time for amounts above ₹2 lakh.\n- **Google Pay / PhonePe** — Popular UPI apps with wide merchant and P2P acceptance.",
    },
    {
      heading: "How Escrow Protection Works",
      text: "Every USDT trade on P2PxBT is protected by our escrow system. Here's how it works: when a trade starts, the seller's USDT is locked in a secure escrow wallet. The buyer then sends INR payment via their preferred method (UPI, bank transfer, etc.). Once the seller confirms receipt of payment, the USDT is released from escrow to the buyer's wallet. If there's any dispute, P2PxBT's support team reviews the evidence and resolves it fairly. This system eliminates the risk of fraud completely.",
    },
    {
      heading: "USDT Trading Tips for Indian Traders",
      text: "Here are tips for safe and successful USDT trading in India:\n\n- **Compare rates** — Check offers from multiple traders to find the best USDT/INR rate\n- **Verify the trader** — Choose traders with 95%+ completion rates and 100+ trades\n- **Use UPI for speed** — UPI payments are instant and free, making them ideal for quick trades\n- **Start with small amounts** — Build trust with a ₹500–₹1,000 first trade\n- **Keep payment proof** — Always screenshot your payment confirmation\n- **Never trade off-platform** — Always use P2PxBT's escrow for protection",
    },
  ],
  faq: [
    { q: "Is it legal to buy USDT in India?", a: "Yes. Cryptocurrency trading is legal in India. The Supreme Court lifted the RBI ban in 2020, and crypto is now regulated under the income tax framework. A 30% tax applies on crypto gains, and 1% TDS on transfers above ₹50,000." },
    { q: "What is the best payment method for buying USDT in India?", a: "UPI is the fastest and most popular method. It's instant, free, and available 24/7. For larger trades (above ₹50,000), many traders prefer bank transfer via NEFT or RTGS." },
    { q: "How much USDT can I buy at once?", a: "There's no platform limit. The amount depends on the trader's available balance. Most traders offer between ₹500 and ₹10,00,000 per trade." },
    { q: "How long does a USDT trade take in India?", a: "Most UPI trades complete in 5–10 minutes. Bank transfer trades may take 15–30 minutes depending on the transfer method (IMPS is fastest, NEFT takes longer)." },
    { q: "Is P2PxBT safe for Indian traders?", a: "Absolutely. Every trade uses escrow protection, all traders are verified, and our dispute resolution team handles any issues. Over 12,000 trades have been completed safely on P2PxBT." },
  ],
  relatedLinks: [
    ...indianCities.slice(0, 7).map(c => ({ label: `Buy USDT in ${c.name}`, href: `/buy-usdt-${c.slug}` })),
    { label: "Buy USDT with UPI", href: "/buy-usdt-upi" },
    { label: "Buy USDT via Bank Transfer", href: "/buy-usdt-bank-transfer" },
    { label: "Sell USDT in India", href: "/sell-usdt-india" },
    { label: "View Marketplace", href: "/marketplace" },
  ],
  parentLinks: [{ label: "Home", href: "/" }, { label: "Buy USDT", href: "/buy-usdt" }],
  breadcrumbs: [{ label: "Home", href: "/" }, { label: "Buy USDT", href: "/buy-usdt" }, { label: "India", href: "/buy-usdt-india" }],
  filterConfig: { asset: "USDT", country: "India", type: "buy" },
};

// Check if /buy-usdt-india already exists in countryPages; if so, replace it
const existingIndiaIdx = countryPages.findIndex(p => p.slug === "buy-usdt-india");
if (existingIndiaIdx >= 0) {
  countryPages[existingIndiaIdx] = buyUsdtIndiaHub;
} else {
  hubPages.push(buyUsdtIndiaHub);
}

// B. /buy-usdt-upi — Links to all UPI city pages
const buyUsdtUpiHub: SEOPageData = {
  slug: "buy-usdt-upi",
  title: "Buy USDT with UPI",
  metaTitle: "Buy USDT with UPI | Instant P2P Trades in India | P2PxBT",
  metaDescription: "Buy USDT instantly using UPI — Google Pay, PhonePe, Paytm. Escrow-protected P2P trades across all major Indian cities. Best USDT/INR rates.",
  h1: "Buy USDT with UPI — Instant P2P Trades",
  intro: "Buy USDT instantly using any UPI app — Google Pay, PhonePe, Paytm, or your bank's UPI. Payments are instant, free, and available 24/7. All trades are escrow-protected on P2PxBT. Choose your city for the best local rates.",
  action: "buy",
  coin: "USDT",
  coinSymbol: "USDT",
  paymentMethod: "UPI",
  contentSections: [
    {
      heading: "Buy USDT with UPI in Every City",
      text: indianCities.map(c => {
        const ld = cityLiveDataMap[c.slug];
        return `- **${c.name}** — ${ld.sellers} UPI sellers • Last trade: ${ld.lastTradeAgo} • Avg rate: ${ld.avgPrice}`;
      }).join("\n"),
    },
    {
      heading: "Why UPI is the Best Way to Buy USDT",
      text: "UPI (Unified Payments Interface) has revolutionized payments in India with 300M+ active users. Here's why it's perfect for USDT trading:\n\n- **Instant** — Payments settle in seconds, not minutes or hours\n- **Free** — Zero transaction fees on UPI transfers\n- **24/7** — Available round the clock, including weekends and holidays\n- **Secure** — Protected by your UPI PIN and bank's security layer\n- **Universal** — Works with all major banks and payment apps\n\nWhen combined with P2PxBT's escrow protection, UPI provides the fastest and safest way to buy USDT in India.",
    },
    {
      heading: "How to Buy USDT with UPI",
      text: "Follow these steps to buy USDT using UPI:\n\n1. **Sign up on P2PxBT** — Create your free account and verify your email\n2. **Browse UPI offers** — Filter offers by UPI payment method to find the best rates\n3. **Start a trade** — Select an offer and enter your desired USDT amount\n4. **Escrow locks** — The seller's USDT is automatically locked in escrow\n5. **Pay via UPI** — Open Google Pay, PhonePe, or any UPI app and send the INR amount\n6. **Confirm & receive** — Once the seller verifies your payment, USDT is released to your wallet",
    },
    {
      heading: "Supported UPI Apps",
      text: "P2PxBT traders accept payments from all UPI apps:\n\n- **Google Pay (GPay)** — Most popular UPI app with seamless scan-and-pay\n- **PhonePe** — Widely used with cashback offers and bill payments\n- **Paytm** — India's super app with UPI, wallet, and banking\n- **BHIM** — Government's official UPI app with multi-language support\n- **Amazon Pay** — Integrated UPI for Amazon users\n- **Bank apps** — SBI YONO, HDFC, ICICI, Kotak, and all bank UPI apps",
    },
    {
      heading: "UPI Transaction Limits for Crypto Trading",
      text: "UPI has the following transaction limits that affect USDT trading:\n\n- **Per transaction**: ₹1,00,000 (₹1 lakh)\n- **Daily limit**: ₹1,00,000 for most banks\n- **Monthly limit**: Varies by bank (typically ₹5–10 lakh)\n\nFor trades above ₹1 lakh, consider splitting into multiple UPI payments or using bank transfer (NEFT/RTGS) instead.",
    },
  ],
  faq: [
    { q: "Can I buy USDT using Google Pay?", a: "Yes! Google Pay uses UPI, which is fully supported on P2PxBT. Simply scan the seller's QR code or enter their UPI ID to pay instantly." },
    { q: "Is there a fee for UPI payments?", a: "No, UPI transfers are completely free — no transaction fees for sending or receiving money. P2PxBT charges only a small 0.25% escrow fee." },
    { q: "What is the UPI transaction limit for USDT?", a: "Most banks allow up to ₹1,00,000 per UPI transaction. For larger USDT purchases, you can split into multiple payments or use bank transfer." },
    { q: "How fast is a UPI USDT trade?", a: "UPI payments are instant. Most USDT trades via UPI complete within 5–10 minutes from start to finish, including escrow release." },
    { q: "Can I use UPI at night to buy USDT?", a: "Yes, UPI works 24/7 including weekends and holidays. You can buy USDT any time on P2PxBT." },
  ],
  relatedLinks: [
    ...indianCities.slice(0, 7).map(c => ({ label: `Buy USDT in ${c.name} with UPI`, href: `/buy-usdt-${c.slug}-upi` })),
    { label: "Buy USDT in India", href: "/buy-usdt-india" },
    { label: "Buy USDT via Bank Transfer", href: "/buy-usdt-bank-transfer" },
    { label: "View Marketplace", href: "/marketplace" },
  ],
  parentLinks: [{ label: "Home", href: "/" }, { label: "Buy USDT", href: "/buy-usdt" }],
  breadcrumbs: [{ label: "Home", href: "/" }, { label: "Buy USDT", href: "/buy-usdt" }, { label: "UPI", href: "/buy-usdt-upi" }],
  filterConfig: { asset: "USDT", paymentMethod: "UPI", type: "buy" },
};

// Replace existing /buy-usdt-upi in paymentPages if it exists
const existingUpiIdx = paymentPages.findIndex(p => p.slug === "buy-usdt-upi");
if (existingUpiIdx >= 0) {
  paymentPages[existingUpiIdx] = buyUsdtUpiHub;
} else {
  hubPages.push(buyUsdtUpiHub);
}

// C. /sell-usdt-india — Links to all sell city pages
hubPages.push({
  slug: "sell-usdt-india",
  title: "Sell USDT in India",
  metaTitle: "Sell USDT in India | Get INR Instantly via UPI/Bank | P2PxBT",
  metaDescription: "Sell USDT in India and receive INR instantly via UPI or bank transfer. Escrow-protected P2P trades in Delhi, Mumbai, Bangalore & 11 more cities.",
  h1: "Sell USDT in India — Get INR Instantly",
  intro: "Sell your USDT in India and receive INR directly via UPI or bank transfer. P2PxBT connects you with verified buyers in 14 major Indian cities. Every trade is escrow-protected — you always get paid. Choose your city below to start selling.",
  action: "sell",
  coin: "USDT",
  coinSymbol: "USDT",
  location: "India",
  contentSections: [
    {
      heading: "Sell USDT in Any Indian City",
      text: indianCities.map(c => {
        const ld = cityLiveDataMap[c.slug];
        return `- **${c.name}** — ${ld.buyers} active buyers • Last trade: ${ld.lastTradeAgo} • Avg price: ${ld.avgPrice}`;
      }).join("\n"),
    },
    {
      heading: "How to Sell USDT for INR",
      text: "Selling USDT on P2PxBT is simple and safe:\n\n1. **List your offer** — Set your USDT amount and INR price\n2. **Buyer starts trade** — A buyer locks in your offer\n3. **USDT goes to escrow** — Your USDT is secured in escrow\n4. **Receive INR** — Buyer sends INR via UPI or bank transfer\n5. **Confirm & release** — Verify payment and release USDT from escrow\n\nThe entire process takes 5–15 minutes. You're always protected by escrow.",
    },
    {
      heading: "Why Sell on P2PxBT?",
      text: "P2PxBT is the safest platform to sell USDT in India:\n\n- **Escrow protection** — Your USDT is safe until you confirm payment receipt\n- **Instant INR** — Receive money via UPI (instant) or bank transfer\n- **Set your own price** — You control the USDT/INR rate and margins\n- **Verified buyers** — Trade with rated, verified buyers only\n- **No withdrawal fees** — Your INR goes directly to your bank account",
    },
    {
      heading: "Best Time to Sell USDT",
      text: "USDT demand in India peaks during these times:\n\n- **Evening hours (6 PM – 11 PM IST)** — Highest trading volume as professionals come online\n- **Weekends** — Retail traders are most active on Saturday and Sunday\n- **Market volatility days** — When BTC/ETH prices swing, USDT demand increases\n- **Month-end** — Freelancers converting USDT to INR for expenses\n\nList your sell offers during these periods for the fastest trades.",
    },
  ],
  faq: [
    { q: "How do I receive INR when selling USDT?", a: "Buyers send INR directly to your bank account via UPI, IMPS, or NEFT. You choose which payment methods to accept when creating your sell offer." },
    { q: "How long does it take to sell USDT?", a: "Most trades complete in 5–15 minutes. UPI payments are received instantly, while bank transfers may take 15–30 minutes." },
    { q: "Is there a minimum amount to sell?", a: "You can sell USDT worth as little as ₹500. There's no maximum limit for verified traders." },
    { q: "What if the buyer doesn't pay?", a: "Your USDT stays safely in escrow. If the buyer doesn't send payment within the time limit, the trade is cancelled and your USDT is returned." },
    { q: "What fees does P2PxBT charge sellers?", a: "P2PxBT charges a small 0.25% escrow fee per trade. There are no listing fees or monthly charges." },
  ],
  relatedLinks: [
    ...indianCities.slice(0, 7).map(c => ({ label: `Sell USDT in ${c.name}`, href: `/sell-usdt-${c.slug}` })),
    { label: "Buy USDT in India", href: "/buy-usdt-india" },
    { label: "Sell USDT", href: "/sell-usdt" },
    { label: "View Marketplace", href: "/marketplace" },
  ],
  parentLinks: [{ label: "Home", href: "/" }, { label: "Sell USDT", href: "/sell-usdt" }],
  breadcrumbs: [{ label: "Home", href: "/" }, { label: "Sell USDT", href: "/sell-usdt" }, { label: "India", href: "/sell-usdt-india" }],
  filterConfig: { asset: "USDT", country: "India", type: "sell" },
});

// ══════════════════════════════════════════════
// MASTER EXPORT
// ══════════════════════════════════════════════
export const allSEOPages: SEOPageData[] = [...coinPages, ...countryPages, ...paymentPages, ...comboPages, ...indianCityPages, ...hubPages];

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
    cityPages: indianCityPages.length,
    hubPages: hubPages.length,
  };
}

export { coinPages, countryPages, paymentPages, comboPages, indianCities, locations, paymentMethods as paymentMethodsList, coins as coinsList };
