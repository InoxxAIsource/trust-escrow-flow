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
  relatedLinks: { label: string; href: string }[];
  breadcrumbs: { label: string; href: string }[];
}

const coins = [
  { name: "USDT", symbol: "USDT", slug: "usdt", fullName: "Tether (USDT)" },
  { name: "Bitcoin", symbol: "BTC", slug: "bitcoin", fullName: "Bitcoin (BTC)" },
  { name: "Ethereum", symbol: "ETH", slug: "ethereum", fullName: "Ethereum (ETH)" },
  { name: "Solana", symbol: "SOL", slug: "solana", fullName: "Solana (SOL)" },
];

export const coinPages: SEOPageData[] = [
  ...coins.flatMap((coin) => [
    {
      slug: `buy-${coin.slug}`,
      title: `Buy ${coin.name}`,
      metaTitle: `Buy ${coin.name} Safely with Escrow | TrustP2P`,
      metaDescription: `Buy ${coin.fullName} securely on TrustP2P with escrow protection. Multiple payment methods, verified sellers, and instant trades.`,
      h1: `Buy ${coin.name} with Escrow Protection`,
      intro: `Trade ${coin.fullName} safely on TrustP2P. Our escrow system locks funds until both parties confirm the trade, ensuring zero risk of fraud. Choose from verified sellers, pick your preferred payment method, and start trading in minutes.`,
      action: "buy" as const,
      coin: coin.name,
      coinSymbol: coin.symbol,
      relatedLinks: [
        { label: `Sell ${coin.name}`, href: `/sell-${coin.slug}` },
        { label: `Buy ${coin.name} in India`, href: `/buy-${coin.slug}-india` },
        { label: `Buy ${coin.name} in USA`, href: `/buy-${coin.slug}-usa` },
        { label: "View Marketplace", href: "/marketplace" },
        { label: `How to Buy ${coin.name}`, href: `/blog/how-to-buy-${coin.slug}` },
      ],
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: `Buy ${coin.name}`, href: `/buy-${coin.slug}` },
      ],
    },
    {
      slug: `sell-${coin.slug}`,
      title: `Sell ${coin.name}`,
      metaTitle: `Sell ${coin.name} Safely with Escrow | TrustP2P`,
      metaDescription: `Sell ${coin.fullName} securely on TrustP2P. Escrow-protected trades, verified buyers, and fast payments.`,
      h1: `Sell ${coin.name} Securely on TrustP2P`,
      intro: `Sell your ${coin.fullName} on TrustP2P with full escrow protection. Your crypto is locked safely until the buyer's payment is confirmed. Connect with verified buyers and receive payment through your preferred method.`,
      action: "sell" as const,
      coin: coin.name,
      coinSymbol: coin.symbol,
      relatedLinks: [
        { label: `Buy ${coin.name}`, href: `/buy-${coin.slug}` },
        { label: `Sell ${coin.name} in India`, href: `/sell-${coin.slug}-india` },
        { label: "View Marketplace", href: "/marketplace" },
      ],
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: `Sell ${coin.name}`, href: `/sell-${coin.slug}` },
      ],
    },
  ]),
];

export const locationPages: SEOPageData[] = [
  { slug: "buy-usdt-india", title: "Buy USDT in India", metaTitle: "Buy USDT in India with UPI & Bank Transfer | TrustP2P", metaDescription: "Buy USDT in India using UPI, bank transfer, or PayTM on TrustP2P. Secure escrow-protected P2P trades with verified Indian sellers.", h1: "Buy USDT in India", intro: "Purchase Tether (USDT) in India using popular payment methods like UPI, IMPS, and bank transfer. TrustP2P's escrow protection ensures your funds are safe throughout the entire transaction.", action: "buy", coin: "USDT", coinSymbol: "USDT", location: "India", relatedLinks: [{ label: "Sell USDT in India", href: "/sell-usdt-india" }, { label: "Buy Bitcoin in India", href: "/buy-bitcoin-india" }, { label: "Buy USDT with UPI", href: "/buy-usdt-upi" }, { label: "Marketplace", href: "/marketplace" }], breadcrumbs: [{ label: "Home", href: "/" }, { label: "Buy USDT", href: "/buy-usdt" }, { label: "India", href: "/buy-usdt-india" }] },
  { slug: "buy-usdt-usa", title: "Buy USDT in USA", metaTitle: "Buy USDT in USA with Bank Transfer | TrustP2P", metaDescription: "Buy USDT in the United States using bank transfer, Zelle, or Venmo on TrustP2P. Secure P2P trades with escrow protection.", h1: "Buy USDT in the United States", intro: "Buy Tether (USDT) in the USA using Zelle, bank transfers, and other popular payment methods. All trades are protected by TrustP2P's escrow system.", action: "buy", coin: "USDT", coinSymbol: "USDT", location: "USA", relatedLinks: [{ label: "Sell USDT in USA", href: "/sell-usdt-usa" }, { label: "Buy Bitcoin in USA", href: "/buy-bitcoin-usa" }, { label: "Buy USDT with Bank Transfer", href: "/buy-usdt-bank-transfer" }, { label: "Marketplace", href: "/marketplace" }], breadcrumbs: [{ label: "Home", href: "/" }, { label: "Buy USDT", href: "/buy-usdt" }, { label: "USA", href: "/buy-usdt-usa" }] },
  { slug: "buy-bitcoin-india", title: "Buy Bitcoin in India", metaTitle: "Buy Bitcoin in India with UPI | TrustP2P", metaDescription: "Buy Bitcoin in India using UPI, IMPS, or bank transfer. Escrow-protected P2P trading on TrustP2P.", h1: "Buy Bitcoin in India", intro: "Purchase Bitcoin (BTC) in India with UPI, IMPS, or bank transfer. TrustP2P provides a safe and secure P2P marketplace with escrow protection for every trade.", action: "buy", coin: "Bitcoin", coinSymbol: "BTC", location: "India", relatedLinks: [{ label: "Sell Bitcoin in India", href: "/sell-bitcoin-india" }, { label: "Buy USDT in India", href: "/buy-usdt-india" }, { label: "Buy Bitcoin with UPI", href: "/buy-bitcoin-upi" }, { label: "Marketplace", href: "/marketplace" }], breadcrumbs: [{ label: "Home", href: "/" }, { label: "Buy Bitcoin", href: "/buy-bitcoin" }, { label: "India", href: "/buy-bitcoin-india" }] },
];

export const paymentPages: SEOPageData[] = [
  { slug: "buy-usdt-upi", title: "Buy USDT with UPI", metaTitle: "Buy USDT with UPI - Instant P2P Trades | TrustP2P", metaDescription: "Buy USDT instantly with UPI on TrustP2P. Secure escrow-protected P2P trades with verified sellers accepting UPI payments.", h1: "Buy USDT with UPI", intro: "Buy Tether (USDT) instantly using UPI on TrustP2P. UPI payments are fast, free, and widely accepted. All trades are protected by our secure escrow system.", action: "buy", coin: "USDT", coinSymbol: "USDT", paymentMethod: "UPI", relatedLinks: [{ label: "Buy USDT with Bank Transfer", href: "/buy-usdt-bank-transfer" }, { label: "Buy USDT in India", href: "/buy-usdt-india" }, { label: "Marketplace", href: "/marketplace" }], breadcrumbs: [{ label: "Home", href: "/" }, { label: "Buy USDT", href: "/buy-usdt" }, { label: "UPI", href: "/buy-usdt-upi" }] },
  { slug: "buy-usdt-bank-transfer", title: "Buy USDT with Bank Transfer", metaTitle: "Buy USDT with Bank Transfer | TrustP2P", metaDescription: "Buy USDT with bank transfer on TrustP2P. Secure escrow-protected P2P crypto trading.", h1: "Buy USDT with Bank Transfer", intro: "Buy Tether (USDT) using bank transfer on TrustP2P. Bank transfers are secure and available worldwide. Every trade is protected by our escrow system.", action: "buy", coin: "USDT", coinSymbol: "USDT", paymentMethod: "Bank Transfer", relatedLinks: [{ label: "Buy USDT with UPI", href: "/buy-usdt-upi" }, { label: "Buy Bitcoin with Bank Transfer", href: "/buy-bitcoin-bank-transfer" }, { label: "Marketplace", href: "/marketplace" }], breadcrumbs: [{ label: "Home", href: "/" }, { label: "Buy USDT", href: "/buy-usdt" }, { label: "Bank Transfer", href: "/buy-usdt-bank-transfer" }] },
  { slug: "buy-bitcoin-paypal", title: "Buy Bitcoin with PayPal", metaTitle: "Buy Bitcoin with PayPal | TrustP2P", metaDescription: "Buy Bitcoin with PayPal on TrustP2P. Safe P2P crypto trading with escrow protection.", h1: "Buy Bitcoin with PayPal", intro: "Buy Bitcoin (BTC) using PayPal on TrustP2P. PayPal provides fast and convenient payments. Our escrow system protects both buyers and sellers.", action: "buy", coin: "Bitcoin", coinSymbol: "BTC", paymentMethod: "PayPal", relatedLinks: [{ label: "Buy USDT with PayPal", href: "/buy-usdt-paypal" }, { label: "Buy Bitcoin with Bank Transfer", href: "/buy-bitcoin-bank-transfer" }, { label: "Marketplace", href: "/marketplace" }], breadcrumbs: [{ label: "Home", href: "/" }, { label: "Buy Bitcoin", href: "/buy-bitcoin" }, { label: "PayPal", href: "/buy-bitcoin-paypal" }] },
];

export const allSEOPages = [...coinPages, ...locationPages, ...paymentPages];
