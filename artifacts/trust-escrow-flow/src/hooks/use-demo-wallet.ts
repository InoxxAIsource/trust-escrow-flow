import { useState, useCallback } from "react";

export interface WalletBalance {
  asset: string;
  balance: number;
  lockedBalance: number;
}

const STORAGE_KEY = "trustp2p_demo_wallet";

function loadWallet(): WalletBalance[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return [
    { asset: "USDT", balance: 0, lockedBalance: 0 },
    { asset: "BTC", balance: 0, lockedBalance: 0 },
    { asset: "ETH", balance: 0, lockedBalance: 0 },
    { asset: "SOL", balance: 0, lockedBalance: 0 },
  ];
}

function saveWallet(wallets: WalletBalance[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
}

export function useDemoWallet() {
  const [wallets, setWallets] = useState<WalletBalance[]>(loadWallet);

  const getBalance = useCallback(
    (asset: string) => wallets.find((w) => w.asset === asset) ?? { asset, balance: 0, lockedBalance: 0 },
    [wallets]
  );

  const deposit = useCallback((asset: string, amount: number) => {
    setWallets((prev) => {
      const updated = prev.map((w) =>
        w.asset === asset ? { ...w, balance: w.balance + amount } : w
      );
      saveWallet(updated);
      return updated;
    });
  }, []);

  const lockBalance = useCallback((asset: string, amount: number): boolean => {
    let success = false;
    setWallets((prev) => {
      const wallet = prev.find((w) => w.asset === asset);
      if (!wallet || wallet.balance < amount) return prev;
      success = true;
      const updated = prev.map((w) =>
        w.asset === asset
          ? { ...w, balance: w.balance - amount, lockedBalance: w.lockedBalance + amount }
          : w
      );
      saveWallet(updated);
      return updated;
    });
    return success;
  }, []);

  const unlockBalance = useCallback((asset: string, amount: number) => {
    setWallets((prev) => {
      const updated = prev.map((w) =>
        w.asset === asset
          ? { ...w, balance: w.balance + amount, lockedBalance: Math.max(0, w.lockedBalance - amount) }
          : w
      );
      saveWallet(updated);
      return updated;
    });
  }, []);

  return { wallets, getBalance, deposit, lockBalance, unlockBalance };
}
