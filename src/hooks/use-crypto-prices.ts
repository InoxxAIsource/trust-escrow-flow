import { useQuery } from "@tanstack/react-query";

export interface CryptoPrices {
  bitcoin: { usd: number; inr: number };
  ethereum: { usd: number; inr: number };
  solana: { usd: number; inr: number };
  tether: { usd: number; inr: number };
}

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,tether&vs_currencies=usd,inr";

async function fetchPrices(): Promise<CryptoPrices> {
  const res = await fetch(COINGECKO_URL);
  if (!res.ok) throw new Error("Failed to fetch prices");
  return res.json();
}

export function useCryptoPrices() {
  return useQuery<CryptoPrices>({
    queryKey: ["crypto-prices"],
    queryFn: fetchPrices,
    refetchInterval: 30_000, // refresh every 30s
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

export function getLivePrice(
  prices: CryptoPrices | undefined,
  coin: string,
  currency: string
): number | null {
  if (!prices) return null;
  const id = coinMap[coin];
  if (!id) return null;
  const cur = currency.toLowerCase() as "usd" | "inr";
  return prices[id]?.[cur] ?? null;
}

/** Returns a random margin between min% and max% */
export function randomMargin(min = 10, max = 12): number {
  return 1 + (min + Math.random() * (max - min)) / 100;
}
