// ============================================================
// SEED ENGINE - Multi-Country P2P Offer Generator
// Generates offers across multiple countries with proper
// currency symbols, payment methods, and pricing.
// ============================================================

export interface SeededOffer {
  id: string;
  type: "buy" | "sell";
  asset: string;
  assetSymbol: string;
  price: number;
  marketPrice: number;
  margin: string;
  minLimit: number;
  maxLimit: number;
  availableAmount: number;
  paymentMethods: string[];
  country: string;
  currency: string;
  currencySymbol: string;
  username: string;
  rating: number;
  trades: number;
  completionRate: number;
  isOnline: boolean;
  isVerified: boolean;
  is_seeded: true;
  lastSeen: string;
}

export interface LivePrices {
  USDT: number;
  BTC: number;
  ETH: number;
  SOL: number;
}

// ── Country Configuration ──
export interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  fxRate: number; // fallback USD→local rate
  paymentMethods: string[];
  usernames: string[];
  offerCount: { usdt: [number, number]; crypto: [number, number] }; // [sell, buy] counts
}

/**
 * Two market sets, deliberately different in scope.
 *
 * The first four - US, UK, Europe, Hong Kong - are the settlement markets.
 * They have counterparties in the database, operator-issued payment details
 * and a working trade flow, and they are what `/marketplace` shows to someone
 * arriving at the domain directly.
 *
 * The rest are reach markets. A visitor landing from search on, say,
 * /buy-usdt-india-upi sees a live board of INR offers quoting UPI rather than
 * an empty page or a redirect somewhere irrelevant - the market matches the
 * link that brought them. These generate offers here but have no counterparty
 * rows, so they do not appear in the settlement marketplace.
 *
 * `SETTLEMENT_MARKETS` below is what separates the two; anything not in it is
 * reach-only. Keep that list in step with the demo_counterparties roster.
 */
export const SETTLEMENT_MARKETS = [
  "USA", "UK", "Hong Kong",
  "Germany", "France", "Netherlands", "Ireland", "Spain", "Italy",
] as const;

export function isSettlementMarket(country: string): boolean {
  return (SETTLEMENT_MARKETS as readonly string[]).includes(country);
}

export const countryConfigs: CountryConfig[] = [
  {
    code: "US",
    name: "USA",
    currency: "USD",
    currencySymbol: "$",
    fxRate: 1,
    paymentMethods: ["USA Bank Wire", "ACH Transfer", "Bank Transfer"],
    usernames: [
      "ales_perera", "marco_de_silva", "alen_rajapaksa",
      "monteze_morales", "boris_karloff", "vivian_derozio",
    ],
    offerCount: { usdt: [12, 10], crypto: [5, 5] },
  },
  {
    code: "GB",
    name: "UK",
    currency: "GBP",
    currencySymbol: "£",
    fxRate: 0.79,
    paymentMethods: ["UK Faster Payments", "Bank Transfer"],
    usernames: [
      "oliver_grant", "charlotte_ellis_uk", "thomas_wardle_uk", "sophie_lawson_uk",
      "george_ashford", "harriet_vaughn", "william_pierce", "eleanor_shaw",
      "henry_mallory", "amelia_brooks", "edward_fielding", "isabel_carter",
      "arthur_bennett", "florence_reeves", "hugh_whitfield",
      "cecily_thornton", "rupert_hadley", "beatrice_langton", "alistair_moss",
      "penelope_cross", "jasper_alderton", "claudia_fenn",
    ],
    offerCount: { usdt: [12, 10], crypto: [5, 5] },
  },
  // The eurozone is split per country rather than carried as one "Europe"
  // entry. The SEO pages filter boards by country name, so a single Europe
  // config left /buy-usdt-germany and 63 sibling pages rendering an empty
  // offer table -- live URLs with nothing on them, which is exactly the shape
  // Google declines to index.
  {
    code: "DE",
    name: "Germany",
    currency: "EUR",
    currencySymbol: "€",
    fxRate: 0.92,
    paymentMethods: ["SEPA Transfer", "Bank Transfer"],
    usernames: [
      "lucas_meyer", "anna_hoffman", "niklas_berg", "katrin_weber",
      "andreas_klein", "greta_shulz", "jonas_richter", "lena_faber",
      "felix_bauer", "sophie_hartmann", "max_schneider", "clara_vogel",
      "paul_zimmermann", "mia_krause", "ben_wolf", "julia_braun",
    ],
    offerCount: { usdt: [10, 8], crypto: [4, 4] },
  },
  {
    code: "FR",
    name: "France",
    currency: "EUR",
    currencySymbol: "€",
    fxRate: 0.92,
    paymentMethods: ["SEPA Transfer", "Bank Transfer"],
    usernames: [
      "elena_moreau", "clara_dubois", "julien_laurent", "hugo_marchand",
      "camille_perrin", "antoine_giraud", "manon_leclerc", "theo_rousseau",
      "lea_fontaine", "nicolas_blanc", "alice_renard", "pierre_chevalier",
      "marie_dupont", "thomas_martin", "sarah_petit", "romain_robert",
    ],
    offerCount: { usdt: [10, 8], crypto: [4, 4] },
  },
  {
    code: "NL",
    name: "Netherlands",
    currency: "EUR",
    currencySymbol: "€",
    fxRate: 0.92,
    paymentMethods: ["SEPA Transfer", "Bank Transfer"],
    usernames: [
      "pieter_vos", "sanne_dijkstra", "bram_jansen", "fleur_van_dijk",
      "daan_bakker", "eva_hendriks", "lars_de_boer", "inge_smit",
      "tim_visser", "nora_meijer", "stefan_berg", "lotte_kok",
    ],
    offerCount: { usdt: [10, 8], crypto: [4, 4] },
  },
  {
    code: "IE",
    name: "Ireland",
    currency: "EUR",
    currencySymbol: "€",
    fxRate: 0.92,
    paymentMethods: ["SEPA Transfer", "Bank Transfer"],
    usernames: [
      "sean_donovan", "liam_mcgrath", "aoife_brennan", "cillian_walsh",
      "niamh_gallagher", "eoin_murphy", "siobhan_ryan", "padraig_kelly",
      "orla_quinn", "declan_barry", "ciara_lynch", "rory_fitzgerald",
    ],
    offerCount: { usdt: [10, 8], crypto: [4, 4] },
  },
  {
    code: "ES",
    name: "Spain",
    currency: "EUR",
    currencySymbol: "€",
    fxRate: 0.92,
    paymentMethods: ["SEPA Transfer", "Bank Transfer"],
    usernames: [
      "sofia_alvarez", "diego_navarro", "maria_costa", "pablo_serrano",
      "lucia_ibanez", "javier_moline", "carmen_vidal", "andres_mora",
      "isabel_reyes", "miguel_soto", "laura_gimenez", "carlos_fuentes",
    ],
    offerCount: { usdt: [10, 8], crypto: [4, 4] },
  },
  {
    code: "IT",
    name: "Italy",
    currency: "EUR",
    currencySymbol: "€",
    fxRate: 0.92,
    paymentMethods: ["SEPA Transfer", "Bank Transfer"],
    usernames: [
      "matteo_ricci", "marco_bianchi", "chiara_rossi", "giulia_conti",
      "lorenzo_greco", "alessia_ferrara", "luca_marini", "valentina_esposito",
      "andrea_romano", "francesca_russo", "giuseppe_gallo", "elena_colombo",
    ],
    offerCount: { usdt: [10, 8], crypto: [4, 4] },
  },
  {
    code: "HK",
    name: "Hong Kong",
    currency: "HKD",
    currencySymbol: "HK$",
    fxRate: 7.82,
    paymentMethods: ["FPS Transfer", "Bank Transfer"],
    usernames: [
      "chan_wing_ki", "lee_siu_man", "wong_kin_fai", "lam_pui_ying",
      "ng_kwok_hang", "cheung_mei_ling", "ho_wai_lun", "ma_tsz_kwan",
      "yip_chun_hong", "kwong_siu_wai", "tang_yin_fong", "chow_ka_shing",
      "liu_ming_fat", "fung_yee_man", "tsang_kam_tong", "leung_hoi_yin",
      "mo_chi_keung", "to_wai_han", "siu_lok_ting", "poon_tak_wah",
    ],
    offerCount: { usdt: [12, 10], crypto: [5, 5] },
  },

  // ── Reach markets ────────────────────────────────────────────────────────
  // fxRate is local currency per USD. Approximate and static by design: these
  // scale the displayed bands, and a board that silently repriced itself on
  // every render would be worse than one that is consistently approximate.
  {
    code: "IN",
    name: "India",
    currency: "INR",
    currencySymbol: "₹",
    fxRate: 83.5,
    paymentMethods: ["UPI", "IMPS", "Bank Transfer", "PayTM", "Google Pay"],
    usernames: [
      "arjun_mehta", "priya_nair", "rohit_sharma_p2p", "ananya_iyer",
      "vikram_desai", "sneha_kulkarni", "karan_malhotra", "divya_rao",
      "aditya_verma", "meera_pillai", "rahul_bhatt", "ishita_chawla",
      "nikhil_reddy", "tanvi_joshi", "siddharth_menon", "aarti_gupta",
    ],
    offerCount: { usdt: [11, 8], crypto: [5, 4] },
  },
  {
    code: "NG",
    name: "Nigeria",
    currency: "NGN",
    currencySymbol: "₦",
    fxRate: 1550,
    paymentMethods: ["Bank Transfer", "OPay"],
    usernames: [
      "chinedu_okafor", "amaka_eze", "tunde_adeyemi", "ngozi_balogun",
      "emeka_nwosu", "funmi_adebayo", "ifeanyi_obi", "zainab_yusuf",
      "kelechi_uche", "bisi_ogunleye",
    ],
    offerCount: { usdt: [8, 6], crypto: [3, 3] },
  },
  {
    code: "PH",
    name: "Philippines",
    currency: "PHP",
    currencySymbol: "₱",
    fxRate: 58,
    paymentMethods: ["GCash", "Bank Transfer", "Maya"],
    usernames: [
      "jose_ramirez_ph", "maria_santos", "carlo_delacruz", "angela_reyes",
      "miguel_bautista", "kristine_lim", "paolo_villanueva", "rhea_mendoza",
      "diego_aquino", "camille_navarro",
    ],
    offerCount: { usdt: [8, 6], crypto: [4, 3] },
  },
  {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    currencySymbol: "CA$",
    fxRate: 1.36,
    paymentMethods: ["Interac e-Transfer", "Bank Transfer"],
    usernames: [
      "liam_tremblay", "avery_gagnon", "noah_lavoie", "chloe_bergeron",
      "owen_fortin", "maya_chartrand", "ethan_boucher", "sadie_lemieux",
    ],
    offerCount: { usdt: [6, 5], crypto: [4, 3] },
  },
  {
    code: "AU",
    name: "Australia",
    currency: "AUD",
    currencySymbol: "A$",
    fxRate: 1.52,
    paymentMethods: ["Bank Transfer", "PayID"],
    usernames: [
      "jack_thompson_au", "ruby_mitchell", "cooper_hayes", "matilda_ward",
      "lachlan_reid", "harper_dawson", "flynn_kerrigan", "isla_beaumont",
    ],
    offerCount: { usdt: [6, 5], crypto: [4, 3] },
  },
  {
    code: "BR",
    name: "Brazil",
    currency: "BRL",
    currencySymbol: "R$",
    fxRate: 5.4,
    paymentMethods: ["PIX", "Bank Transfer"],
    usernames: [
      "lucas_oliveira", "beatriz_souza", "rafael_lima", "juliana_costa",
      "gustavo_almeida", "camila_ferreira", "thiago_barros", "leticia_pinto",
    ],
    offerCount: { usdt: [8, 6], crypto: [4, 3] },
  },
  {
    code: "TR",
    name: "Turkey",
    currency: "TRY",
    currencySymbol: "₺",
    fxRate: 34,
    paymentMethods: ["Bank Transfer", "Papara"],
    usernames: [
      "emre_yilmaz", "elif_kaya", "burak_demir", "zeynep_arslan",
      "mert_celik", "selin_dogan", "kaan_ozturk", "ayse_polat",
    ],
    offerCount: { usdt: [7, 5], crypto: [3, 3] },
  },
  {
    code: "AE",
    name: "UAE",
    currency: "AED",
    currencySymbol: "AED",
    fxRate: 3.67,
    paymentMethods: ["Bank Transfer", "Cash Deposit"],
    usernames: [
      "omar_alfarsi", "layla_hassan", "yousef_almansoori", "noor_khalid",
      "hamdan_alsuwaidi", "rania_saleh", "faisal_alnuaimi", "dana_ibrahim",
    ],
    offerCount: { usdt: [7, 5], crypto: [4, 3] },
  },
  {
    code: "ID",
    name: "Indonesia",
    currency: "IDR",
    currencySymbol: "Rp",
    fxRate: 15800,
    paymentMethods: ["Bank Transfer", "OVO", "Dana"],
    usernames: [
      "budi_santoso", "sari_wijaya", "agus_pratama", "dewi_kusuma",
      "rizky_hidayat", "putri_anggraini", "bayu_nugroho", "intan_permata",
    ],
    offerCount: { usdt: [7, 5], crypto: [3, 3] },
  },
  {
    code: "KE",
    name: "Kenya",
    currency: "KES",
    currencySymbol: "KSh",
    fxRate: 129,
    paymentMethods: ["M-Pesa", "Bank Transfer"],
    usernames: [
      "brian_kamau", "wanjiru_mwangi", "otieno_ochieng", "amina_hassan_ke",
      "kipchoge_rono", "nyambura_kariuki", "juma_mutiso", "achieng_odhiambo",
    ],
    offerCount: { usdt: [7, 5], crypto: [3, 3] },
  },
  {
    code: "SG",
    name: "Singapore",
    currency: "SGD",
    currencySymbol: "S$",
    fxRate: 1.34,
    paymentMethods: ["Bank Transfer", "PayNow"],
    usernames: [
      "wei_ming_tan", "shanti_kumar", "jun_hao_lim", "grace_chandra",
      "kai_wen_ong", "farah_ismail", "zhi_hao_goh", "priya_raman",
    ],
    offerCount: { usdt: [6, 5], crypto: [4, 3] },
  },
  {
    code: "MX",
    name: "Mexico",
    currency: "MXN",
    currencySymbol: "MX$",
    fxRate: 17.2,
    paymentMethods: ["SPEI", "Bank Transfer"],
    usernames: [
      "carlos_hernandez", "valeria_ramirez", "diego_torres_mx", "renata_flores",
      "alejandro_ruiz", "ximena_castro", "emilio_vargas", "regina_medina",
    ],
    offerCount: { usdt: [7, 5], crypto: [3, 3] },
  },
];

// ── Limit bounds (in USD, converted to local currency per offer) ──
const LIMIT_MIN_USD = 100;
const LIMIT_MAX_USD = 48_000;

// ── Constants ──

const assets = [
  { name: "USDT", symbol: "USDT", baseUSD: 1 },
  { name: "Bitcoin", symbol: "BTC", baseUSD: 87000 },
  { name: "Ethereum", symbol: "ETH", baseUSD: 2100 },
  { name: "Solana", symbol: "SOL", baseUSD: 140 },
];

// Legacy exports for SEO pages compatibility
const countries = countryConfigs.map((c) => c.name);

const paymentsByCountry: Record<string, string[]> = {};
const currencyByCountry: Record<string, string> = {};
countryConfigs.forEach((c) => {
  paymentsByCountry[c.name] = c.paymentMethods;
  currencyByCountry[c.name] = c.currency;
});

// ── Deterministic seeded random ──
let _seed = Date.now();
function seededRandom(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed & 0x7fffffff) / 0x7fffffff;
}

function randBetween(min: number, max: number): number {
  return min + seededRandom() * (max - min);
}

function generateId(): string {
  return `seed-${Math.floor(seededRandom() * 1e12).toString(36)}`;
}

// ── Payment method assignment based on amount ──

/**
 * Rotates the primary rail across each country's full list.
 *
 * The previous version only ever indexed [0] and [1], so a country's third
 * rail onward could not appear on any offer. India lists five and the Philippines
 * three, which left /buy-usdt-paytm, /buy-usdt-google-pay, /buy-usdt-maya and
 * /buy-usdt-dana rendering an empty board on every load.
 *
 * A rotation rather than another random draw because the offer seed is the
 * wall clock: a random pick would leave a rail missing on some page loads and
 * present on others, which is worse than either.
 */
let _pmRotation = new Map<string, number>();

function assignPaymentMethods(
  country: CountryConfig,
  maxLimit: number,
  assetSymbol: string,
): string[] {
  const methods = country.paymentMethods;
  if (methods.length === 1) return [...methods];

  // Large tickets settle by bank transfer wherever the country offers one --
  // mobile wallets carry limits well below this. Checked before the rotation
  // advances, so an override does not consume a turn: India's fifth rail
  // (Google Pay) was reached only on every fifth offer, and those turns kept
  // landing on large tickets and being swallowed here.
  const bank = methods.find((m) => m === "Bank Transfer");
  if (bank && maxLimit > 500000 * country.fxRate / 85.5) return [bank];

  // Keyed per country AND asset: the landing pages filter on both, so a
  // rotation shared across assets can still leave /buy-solana-imps empty
  // while /buy-usdt-imps fills.
  const key = `${country.code}:${assetSymbol}`;
  const n = _pmRotation.get(key) ?? 0;
  _pmRotation.set(key, n + 1);
  const primary = methods[n % methods.length];

  const secondary = methods.find((m) => m !== primary);
  if (!secondary) return [primary];

  // Small tickets usually quote one rail; mid-size ones quote two.
  if (maxLimit <= 100000 * country.fxRate / 85.5) {
    return seededRandom() > 0.3 ? [primary] : [primary, secondary];
  }
  return [primary, secondary];
}

// ── Inverse liquidity: lower price → higher amount ──
function computeAvailableAmount(priceRatio: number, fxRate: number): number {
  const inverted = 1 - priceRatio;
  const baseAmount = 50000 + inverted * 450000;
  return Math.round(baseAmount * fxRate / 85.5); // scale to local currency
}

/**
 * Per-offer randomised limits within the $100 - $48,000 USD window.
 * Min ranges from $100 to $1,500; max ranges from $4,000 to $48,000.
 * Both are rounded to clean local-currency increments so they read naturally.
 */
function computeLimits(fxRate: number): { minLimit: number; maxLimit: number } {
  // Min: $100 – $1,500 USD, rounded to nearest $50-equivalent in local currency
  const minUSD = LIMIT_MIN_USD + seededRandom() * (1500 - LIMIT_MIN_USD);
  // Max: $4,000 – $48,000 USD, rounded to nearest $500-equivalent
  const maxUSD = 4000 + seededRandom() * (LIMIT_MAX_USD - 4000);

  // Round min to nearest 50 local units, max to nearest 500 local units
  const roundTo = (val: number, step: number) => Math.round(val / step) * step;
  const minStep = Math.max(1, Math.round(50 * fxRate));
  const maxStep = Math.max(1, Math.round(500 * fxRate));

  const minLimit = Math.max(Math.round(LIMIT_MIN_USD * fxRate), roundTo(minUSD * fxRate, minStep));
  const maxLimit = Math.min(Math.round(LIMIT_MAX_USD * fxRate), roundTo(maxUSD * fxRate, maxStep));

  // Guarantee min < max with at least a $1,000 USD gap
  const gapFloor = Math.round(1000 * fxRate);
  return {
    minLimit,
    maxLimit: Math.max(maxLimit, minLimit + gapFloor),
  };
}

// ── Pick unique username (scoped per country:asset namespace) ──
// Each asset market in a country draws from the same name pool independently,
// so BTC sellers look different from ETH sellers even in the same country,
// without needing a huge pool or falling back to numbered suffixes.
let _usedUsernames: Map<string, Set<string>> = new Map();
function pickUsername(pool: string[], namespace: string): string {
  if (!_usedUsernames.has(namespace)) _usedUsernames.set(namespace, new Set());
  const used = _usedUsernames.get(namespace)!;
  for (let attempt = 0; attempt < 100; attempt++) {
    const idx = Math.floor(seededRandom() * pool.length);
    const name = pool[idx];
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  // Fallback: pool exhausted for this namespace — append a short suffix.
  const base = pool[Math.floor(seededRandom() * pool.length)];
  const suffix = Math.floor(seededRandom() * 99) + 1;
  const fallback = `${base}_${suffix}`;
  used.add(fallback);
  return fallback;
}

// ── Trader profile ──
function generateTrader(country: CountryConfig, namespace: string) {
  return {
    username: pickUsername(country.usernames, namespace),
    rating: +randBetween(4.2, 5.0).toFixed(1),
    trades: Math.floor(randBetween(100, 5000)),
    completionRate: +randBetween(94, 100).toFixed(1),
    isOnline: seededRandom() > 0.25,
    isVerified: seededRandom() > 0.15,
    lastSeen: seededRandom() > 0.5 ? "Online" : `${Math.floor(randBetween(1, 20))}m ago`,
  };
}

// ── USDT Offer Generator (per country) ──
// Bands are anchored in USD, matching the demo's quote currency:
//   sell-type offers (shown on the Buy tab)  - $1.04 to $1.06 per USDT
//   buy-type offers  (shown on the Sell tab) - $0.96 to $0.98 per USDT
// Each country's band is the USD band converted at its own fxRate.
function generateUSDTOffers(country: CountryConfig, usdtPriceLocal: number): SeededOffer[] {
  const offers: SeededOffer[] = [];
  const marketPrice = usdtPriceLocal;
  const [sellCount, buyCount] = country.offerCount.usdt;

  // USD reference bands, mirroring the +4-6% / -2-4% spreads used elsewhere.
  const USD_SELL_MIN = 1.04;
  const USD_SELL_MAX = 1.06;
  const USD_BUY_MIN = 0.96;
  const USD_BUY_MAX = 0.98;
  // fxRate is local currency per USD, so it converts the band directly.
  const localScale = country.fxRate;
  const sellMin = USD_SELL_MIN * localScale;
  const sellMax = USD_SELL_MAX * localScale;
  const buyMin = USD_BUY_MIN * localScale;
  const buyMax = USD_BUY_MAX * localScale;

  // SELL offers (shown on Buy tab): strict band sellMin..sellMax
  for (let i = 0; i < sellCount; i++) {
    const ratio = sellCount > 1 ? i / (sellCount - 1) : 0;
    const rawPrice = sellMin + ratio * (sellMax - sellMin) + randBetween(-0.4, 0.4) * localScale;
    const price = +Math.min(sellMax, Math.max(sellMin, rawPrice)).toFixed(2);
    const marginPct = +((price / marketPrice - 1) * 100).toFixed(1);
    const availableAmount = computeAvailableAmount(ratio, country.fxRate);
    const { minLimit, maxLimit } = computeLimits(country.fxRate);

    offers.push({
      id: generateId(),
      type: "sell",
      asset: "USDT",
      assetSymbol: "USDT",
      price,
      marketPrice: +marketPrice.toFixed(2),
      margin: `+${Math.max(marginPct, 0.1).toFixed(1)}%`,
      minLimit,
      maxLimit,
      availableAmount,
      paymentMethods: assignPaymentMethods(country, maxLimit, "USDT"),
      country: country.name,
      currency: country.currency,
      currencySymbol: country.currencySymbol,
      ...generateTrader(country, `${country.name}:USDT`),
      is_seeded: true,
    });
  }

  // BUY offers (shown on Sell tab): strict band buyMin..buyMax
  for (let i = 0; i < buyCount; i++) {
    const ratio = buyCount > 1 ? i / (buyCount - 1) : 0;
    const rawPrice = buyMin + ratio * (buyMax - buyMin) + randBetween(-0.3, 0.3) * localScale;
    const price = +Math.min(buyMax, Math.max(buyMin, rawPrice)).toFixed(2);
    const marginPct = +((price / marketPrice - 1) * 100).toFixed(1);
    const availableAmount = computeAvailableAmount(ratio, country.fxRate);
    const { minLimit, maxLimit } = computeLimits(country.fxRate);

    offers.push({
      id: generateId(),
      type: "buy",
      asset: "USDT",
      assetSymbol: "USDT",
      price,
      marketPrice: +marketPrice.toFixed(2),
      margin: `+${Math.max(marginPct, 0.1).toFixed(1)}%`,
      minLimit,
      maxLimit,
      availableAmount,
      paymentMethods: assignPaymentMethods(country, maxLimit, "USDT"),
      country: country.name,
      currency: country.currency,
      currencySymbol: country.currencySymbol,
      ...generateTrader(country, `${country.name}:USDT`),
      is_seeded: true,
    });
  }

  return offers;
}

// ── BTC/ETH/SOL Generator (per country) ──
function generateCryptoOffers(
  assetName: string,
  assetSymbol: string,
  livePriceUSD: number,
  country: CountryConfig
): SeededOffer[] {
  const offers: SeededOffer[] = [];
  const marketPriceLocal = +(livePriceUSD * country.fxRate).toFixed(2);
  const [sellCount, buyCount] = country.offerCount.crypto;

  // SELL offers: +10% above market
  for (let i = 0; i < sellCount; i++) {
    const ratio = sellCount > 1 ? i / (sellCount - 1) : 0;
    const variation = 1.10 + randBetween(-0.005, 0.005);
    const price = +(marketPriceLocal * variation).toFixed(2);
    const marginPct = +((price / marketPriceLocal - 1) * 100).toFixed(1);
    const availableAmount = computeAvailableAmount(ratio, country.fxRate);
    const { minLimit, maxLimit } = computeLimits(country.fxRate);

    offers.push({
      id: generateId(),
      type: "sell",
      asset: assetName,
      assetSymbol,
      price,
      marketPrice: marketPriceLocal,
      margin: `+${Math.max(marginPct, 0.1).toFixed(1)}%`,
      minLimit,
      maxLimit,
      availableAmount,
      paymentMethods: assignPaymentMethods(country, maxLimit, assetSymbol),
      country: country.name,
      currency: country.currency,
      currencySymbol: country.currencySymbol,
      ...generateTrader(country, `${country.name}:${assetSymbol}`),
      is_seeded: true,
    });
  }

  // BUY offers: +2% above market
  for (let i = 0; i < buyCount; i++) {
    const ratio = buyCount > 1 ? i / (buyCount - 1) : 0;
    const variation = 1.02 + randBetween(-0.005, 0.005);
    const price = +(marketPriceLocal * variation).toFixed(2);
    const marginPct = +((price / marketPriceLocal - 1) * 100).toFixed(1);
    const availableAmount = computeAvailableAmount(ratio, country.fxRate);
    const { minLimit, maxLimit } = computeLimits(country.fxRate);

    offers.push({
      id: generateId(),
      type: "buy",
      asset: assetName,
      assetSymbol,
      price,
      marketPrice: marketPriceLocal,
      margin: `+${Math.max(marginPct, 0.1).toFixed(1)}%`,
      minLimit,
      maxLimit,
      availableAmount,
      paymentMethods: assignPaymentMethods(country, maxLimit, assetSymbol),
      country: country.name,
      currency: country.currency,
      currencySymbol: country.currencySymbol,
      ...generateTrader(country, `${country.name}:${assetSymbol}`),
      is_seeded: true,
    });
  }

  return offers;
}

// ── Main entry point ──
/**
 * Guarantees every rail a country advertises appears on at least one offer for
 * every asset.
 *
 * Rotation gets close but cannot guarantee it: how many offers a rail wins
 * depends on ticket size, which is drawn randomly, and the large-ticket
 * override diverts some turns to Bank Transfer. With India quoting five rails
 * against nine Bitcoin offers, the fifth rail dropped out on some page loads
 * and appeared on others - so /buy-bitcoin-google-pay showed an empty board
 * intermittently, which is harder to notice than a consistently broken one.
 *
 * This runs once after generation and adds any missing rail to an existing
 * offer, so the landing page for every advertised rail always has something on
 * it.
 */
function ensureRailCoverage(offers: SeededOffer[]): void {
  // Grouped by side as well as market and asset. The payment-rail landing
  // pages filter on `type`, so a rail that happens to land only on sell-side
  // offers still leaves /buy-bitcoin-google-pay empty.
  const byMarket = new Map<string, SeededOffer[]>();
  for (const offer of offers) {
    const key = `${offer.country}:${offer.assetSymbol}:${offer.type}`;
    const list = byMarket.get(key);
    if (list) list.push(offer);
    else byMarket.set(key, [offer]);
  }

  for (const country of countryConfigs) {
    for (const asset of assets) {
      for (const side of ["buy", "sell"] as const) {
        const group = byMarket.get(`${country.name}:${asset.symbol}:${side}`);
        if (!group?.length) continue;

        const present = new Set(group.flatMap((o) => o.paymentMethods));
        const missing = country.paymentMethods.filter((m) => !present.has(m));

        missing.forEach((rail, i) => {
          const target = group[i % group.length];
          if (!target.paymentMethods.includes(rail)) target.paymentMethods.push(rail);
        });
      }
    }
  }
}

export function generateAllOffers(livePricesUSD?: Partial<LivePrices>): SeededOffer[] {
  _seed = Date.now();
  _usedUsernames = new Map();
  // Reset so rail coverage is identical on every call, not dependent on how
  // many times the generator has already run this session.
  _pmRotation = new Map();

  const usdtPrice = livePricesUSD?.USDT ?? 1;
  const btcPrice = livePricesUSD?.BTC ?? 87000;
  const ethPrice = livePricesUSD?.ETH ?? 2100;
  const solPrice = livePricesUSD?.SOL ?? 140;

  const allOffers: SeededOffer[] = [];

  for (const country of countryConfigs) {
    const localFxRate = country.fxRate;

    allOffers.push(...generateUSDTOffers(country, usdtPrice * localFxRate));
    allOffers.push(...generateCryptoOffers("Bitcoin", "BTC", btcPrice, { ...country, fxRate: localFxRate }));
    allOffers.push(...generateCryptoOffers("Ethereum", "ETH", ethPrice, { ...country, fxRate: localFxRate }));
    allOffers.push(...generateCryptoOffers("Solana", "SOL", solPrice, { ...country, fxRate: localFxRate }));
  }

  ensureRailCoverage(allOffers);
  return allOffers;
}

// ── Filter offers ──
export function filterOffers(
  offers: SeededOffer[],
  filters: {
    asset?: string;
    country?: string;
    currency?: string;
    paymentMethod?: string;
    type?: "buy" | "sell";
  }
): SeededOffer[] {
  return offers.filter((o) => {
    if (filters.asset && o.asset !== filters.asset && o.assetSymbol !== filters.asset) return false;
    if (filters.country && o.country !== filters.country) return false;
    if (filters.currency && o.currency !== filters.currency) return false;
    if (filters.paymentMethod && !o.paymentMethods.includes(filters.paymentMethod)) return false;
    if (filters.type && o.type !== filters.type) return false;
    return true;
  });
}

// ── Helper exports ──
export function getCountryPaymentMethods(countryName: string): string[] {
  return countryConfigs.find((c) => c.name === countryName)?.paymentMethods ?? [];
}

export function getCountryCurrency(countryName: string): { code: string; symbol: string } {
  const c = countryConfigs.find((c) => c.name === countryName);
  // USD is the demo's quote currency, so it is the sane fallback.
  return { code: c?.currency ?? "USD", symbol: c?.currencySymbol ?? "$" };
}

export function getAllCountries(): string[] {
  return countryConfigs.map((c) => c.name);
}

export function getAllCurrencies(): { code: string; symbol: string; country: string }[] {
  return countryConfigs.map((c) => ({ code: c.currency, symbol: c.currencySymbol, country: c.name }));
}

export { countries, paymentsByCountry, currencyByCountry, assets };
