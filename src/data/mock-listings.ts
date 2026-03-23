export interface Listing {
  id: string;
  username: string;
  type: "buy" | "sell";
  coin: string;
  coinSymbol: string;
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
}

export const mockListings: Listing[] = [
  { id: "1", username: "CryptoKing", type: "sell", coin: "USDT", coinSymbol: "USDT", price: 92.5, currency: "INR", minAmount: 1000, maxAmount: 100000, paymentMethods: ["UPI", "Bank Transfer"], country: "India", completedTrades: 342, rating: 4.9, isVerified: true, isOnline: true },
  { id: "2", username: "BTCTrader", type: "sell", coin: "Bitcoin", coinSymbol: "BTC", price: 67450, currency: "USD", minAmount: 100, maxAmount: 50000, paymentMethods: ["Bank Transfer", "Zelle"], country: "USA", completedTrades: 187, rating: 4.8, isVerified: true, isOnline: true },
  { id: "3", username: "EthWhale", type: "sell", coin: "Ethereum", coinSymbol: "ETH", price: 3420, currency: "USD", minAmount: 50, maxAmount: 25000, paymentMethods: ["PayPal", "Bank Transfer"], country: "UK", completedTrades: 95, rating: 4.7, isVerified: true, isOnline: false },
  { id: "4", username: "SolTrader", type: "sell", coin: "Solana", coinSymbol: "SOL", price: 145, currency: "USD", minAmount: 20, maxAmount: 10000, paymentMethods: ["Venmo", "Zelle"], country: "USA", completedTrades: 63, rating: 4.6, isVerified: false, isOnline: true },
  { id: "5", username: "IndiaP2P", type: "buy", coin: "USDT", coinSymbol: "USDT", price: 91.8, currency: "INR", minAmount: 5000, maxAmount: 500000, paymentMethods: ["UPI", "IMPS"], country: "India", completedTrades: 521, rating: 5.0, isVerified: true, isOnline: true },
  { id: "6", username: "FastBTC", type: "buy", coin: "Bitcoin", coinSymbol: "BTC", price: 67200, currency: "USD", minAmount: 200, maxAmount: 100000, paymentMethods: ["Bank Transfer"], country: "Germany", completedTrades: 234, rating: 4.9, isVerified: true, isOnline: true },
  { id: "7", username: "CryptoSafe", type: "sell", coin: "USDT", coinSymbol: "USDT", price: 1.01, currency: "USD", minAmount: 100, maxAmount: 50000, paymentMethods: ["PayPal", "Venmo", "Zelle"], country: "USA", completedTrades: 412, rating: 4.8, isVerified: true, isOnline: true },
  { id: "8", username: "ETHMaster", type: "buy", coin: "Ethereum", coinSymbol: "ETH", price: 3380, currency: "USD", minAmount: 100, maxAmount: 30000, paymentMethods: ["Bank Transfer", "PayPal"], country: "Canada", completedTrades: 156, rating: 4.7, isVerified: true, isOnline: false },
];

export const paymentMethodOptions = ["UPI", "Bank Transfer", "PayPal", "Zelle", "Venmo", "IMPS"];
export const countryOptions = ["India", "USA", "UK", "Germany", "Canada"];
export const coinOptions = ["USDT", "Bitcoin", "Ethereum", "Solana"];
