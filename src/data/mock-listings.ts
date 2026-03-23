export interface Listing {
  id: string;
  username: string;
  type: "buy" | "sell";
  coin: string;
  coinSymbol: string;
  /** base price will be overridden by live price */
  price: number;
  currency: string;
  minAmount: number;
  maxAmount: number;
  paymentMethods: string[];
  country: string;
  completedTrades: number;
  rating: number;
  isVerified: boolean;
  isOnline: boolean;
  /** random margin seed (10-12%) stored per listing for consistency within a session */
  marginPct: number;
}

/** Sell listings: 10-12% above market. Buy listings: 2-5% above market. */
function randSellMargin() {
  return +(10 + Math.random() * 2).toFixed(2);
}
function randBuyMargin() {
  return +(2 + Math.random() * 3).toFixed(2);
}

export const mockListings: Listing[] = [
  { id: "1", username: "CryptoKing", type: "sell", coin: "USDT", coinSymbol: "USDT", price: 0, currency: "INR", minAmount: 1000, maxAmount: 100000, paymentMethods: ["UPI", "Bank Transfer"], country: "India", completedTrades: 342, rating: 4.9, isVerified: true, isOnline: true, marginPct: randSellMargin() },
  { id: "2", username: "BTCTrader", type: "sell", coin: "Bitcoin", coinSymbol: "BTC", price: 0, currency: "USD", minAmount: 100, maxAmount: 50000, paymentMethods: ["Bank Transfer", "Zelle"], country: "USA", completedTrades: 187, rating: 4.8, isVerified: true, isOnline: true, marginPct: randSellMargin() },
  { id: "3", username: "EthWhale", type: "sell", coin: "Ethereum", coinSymbol: "ETH", price: 0, currency: "USD", minAmount: 50, maxAmount: 25000, paymentMethods: ["PayPal", "Bank Transfer"], country: "UK", completedTrades: 95, rating: 4.7, isVerified: true, isOnline: false, marginPct: randSellMargin() },
  { id: "4", username: "SolTrader", type: "sell", coin: "Solana", coinSymbol: "SOL", price: 0, currency: "USD", minAmount: 20, maxAmount: 10000, paymentMethods: ["Venmo", "Zelle"], country: "USA", completedTrades: 63, rating: 4.6, isVerified: false, isOnline: true, marginPct: randSellMargin() },
  { id: "5", username: "IndiaP2P", type: "buy", coin: "USDT", coinSymbol: "USDT", price: 0, currency: "INR", minAmount: 5000, maxAmount: 500000, paymentMethods: ["UPI", "IMPS"], country: "India", completedTrades: 521, rating: 5.0, isVerified: true, isOnline: true, marginPct: randBuyMargin() },
  { id: "6", username: "FastBTC", type: "buy", coin: "Bitcoin", coinSymbol: "BTC", price: 0, currency: "USD", minAmount: 200, maxAmount: 100000, paymentMethods: ["Bank Transfer"], country: "Germany", completedTrades: 234, rating: 4.9, isVerified: true, isOnline: true, marginPct: randBuyMargin() },
  { id: "7", username: "CryptoSafe", type: "sell", coin: "USDT", coinSymbol: "USDT", price: 0, currency: "USD", minAmount: 100, maxAmount: 50000, paymentMethods: ["PayPal", "Venmo", "Zelle"], country: "USA", completedTrades: 412, rating: 4.8, isVerified: true, isOnline: true, marginPct: randSellMargin() },
  { id: "8", username: "ETHMaster", type: "buy", coin: "Ethereum", coinSymbol: "ETH", price: 0, currency: "USD", minAmount: 100, maxAmount: 30000, paymentMethods: ["Bank Transfer", "PayPal"], country: "Canada", completedTrades: 156, rating: 4.7, isVerified: true, isOnline: false, marginPct: randBuyMargin() },
  { id: "9", username: "SolKnight", type: "sell", coin: "Solana", coinSymbol: "SOL", price: 0, currency: "INR", minAmount: 500, maxAmount: 50000, paymentMethods: ["UPI", "IMPS"], country: "India", completedTrades: 78, rating: 4.5, isVerified: true, isOnline: true, marginPct: randSellMargin() },
  { id: "10", username: "BTCBaron", type: "sell", coin: "Bitcoin", coinSymbol: "BTC", price: 0, currency: "INR", minAmount: 5000, maxAmount: 200000, paymentMethods: ["UPI", "Bank Transfer"], country: "India", completedTrades: 310, rating: 4.9, isVerified: true, isOnline: true, marginPct: randSellMargin() },
  { id: "11", username: "QuickETH", type: "sell", coin: "Ethereum", coinSymbol: "ETH", price: 0, currency: "INR", minAmount: 2000, maxAmount: 100000, paymentMethods: ["UPI"], country: "India", completedTrades: 142, rating: 4.6, isVerified: true, isOnline: true, marginPct: randSellMargin() },
  { id: "12", username: "USDTKing", type: "buy", coin: "USDT", coinSymbol: "USDT", price: 0, currency: "USD", minAmount: 500, maxAmount: 100000, paymentMethods: ["Zelle", "Venmo"], country: "USA", completedTrades: 289, rating: 4.8, isVerified: true, isOnline: false, marginPct: randBuyMargin() },
];

export const paymentMethodOptions = ["UPI", "Bank Transfer", "PayPal", "Zelle", "Venmo", "IMPS"];
export const countryOptions = ["India", "USA", "UK", "Germany", "Canada"];
export const coinOptions = ["USDT", "Bitcoin", "Ethereum", "Solana"];
