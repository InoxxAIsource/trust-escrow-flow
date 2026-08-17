import { useQuery } from "@tanstack/react-query";

/**
 * Legacy price hook retained for the SEO landing pages and offer detail view.
 *
 * USD-only: the demo quotes exclusively in USD, so the second currency leg
 * this previously fetched (and the rate-sanity clamp around it) has been
 * removed. New code should use `useMarketPrices` from
 * `@/hooks/use-demo-market`, which is the marketplace's source of truth.
 */
export interface CoinPrice {
  usd: number;
  usd_24h_change?: number;
}

export interface CryptoPrices {
  bitcoin: CoinPrice;
  ethereum: CoinPrice;
  solana: CoinPrice;
  tether: CoinPrice;
}

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,tether&vs_currencies=usd&include_24hr_change=true";

async function fetchPrices(): Promise<CryptoPrices> {
  const res = await fetch(COINGECKO_URL);
  if (!res.ok) throw new Error("Failed to fetch prices");
  return res.json();
}

export function useCryptoPrices() {
  return useQuery<CryptoPrices>({
    queryKey: ["crypto-prices"],
    queryFn: fetchPrices,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

// Map our coin names to CoinGecko ids
const coinMap: Record<string, keyof CryptoPrices> = {
  Bitcoin: "bitcoin",
  BTC: "bitcoin",
  Ethereum: "ethereum",
  ETH: "ethereum",
  Solana: "solana",
  SOL: "solana",
  USDT: "tether",
  Tether: "tether",
};

export function getLivePrice(prices: CryptoPrices | undefined, coin: string): number | null {
  if (!prices) return null;
  const id = coinMap[coin];
  if (!id) return null;
  return prices[id]?.usd ?? null;
}

/** Returns a random margin between min% and max% */
export function randomMargin(min = 10, max = 12): number {
  return 1 + (min + Math.random() * (max - min)) / 100;
}
