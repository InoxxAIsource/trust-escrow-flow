import { useState, useCallback, useEffect } from "react";

export interface LockedDeal {
  id: string;
  offerId: string;
  asset: string;
  assetSymbol: string;
  amount: number;
  price: number;
  currency: string;
  paymentMethod: string;
  type: "buy" | "sell";
  status: "locked" | "expired" | "completed";
  sellerUsername: string;
  expiresAt: number; // timestamp
  createdAt: number;
}

export interface UserOffer {
  id: string;
  asset: string;
  assetSymbol: string;
  amount: number;
  remainingAmount: number;
  price: number;
  currency: string;
  paymentMethods: string[];
  status: "active" | "inactive" | "completed";
  createdAt: number;
}

const DEALS_KEY = "trustp2p_locked_deals";
const OFFERS_KEY = "trustp2p_user_offers";

function loadDeals(): LockedDeal[] {
  const stored = localStorage.getItem(DEALS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function loadUserOffers(): UserOffer[] {
  const stored = localStorage.getItem(OFFERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function useLockedDeals() {
  const [deals, setDeals] = useState<LockedDeal[]>(loadDeals);
  const [userOffers, setUserOffers] = useState<UserOffer[]>(loadUserOffers);

  // Expire old deals every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      setDeals((prev) => {
        const now = Date.now();
        let changed = false;
        const updated = prev.map((d) => {
          if (d.status === "locked" && d.expiresAt < now) {
            changed = true;
            return { ...d, status: "expired" as const };
          }
          return d;
        });
        if (changed) localStorage.setItem(DEALS_KEY, JSON.stringify(updated));
        return changed ? updated : prev;
      });
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  const lockDeal = useCallback((deal: Omit<LockedDeal, "id" | "status" | "createdAt" | "expiresAt">) => {
    const newDeal: LockedDeal = {
      ...deal,
      id: `deal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "locked",
      createdAt: Date.now(),
      expiresAt: Date.now() + 3 * 60 * 60 * 1000, // 3 hours
    };
    setDeals((prev) => {
      const updated = [newDeal, ...prev];
      localStorage.setItem(DEALS_KEY, JSON.stringify(updated));
      return updated;
    });
    return newDeal;
  }, []);

  const createUserOffer = useCallback((offer: Omit<UserOffer, "id" | "status" | "createdAt" | "remainingAmount">) => {
    const newOffer: UserOffer = {
      ...offer,
      id: `offer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      remainingAmount: offer.amount,
      status: "active",
      createdAt: Date.now(),
    };
    setUserOffers((prev) => {
      const updated = [newOffer, ...prev];
      localStorage.setItem(OFFERS_KEY, JSON.stringify(updated));
      return updated;
    });
    return newOffer;
  }, []);

  const activeDeals = deals.filter((d) => d.status === "locked");
  const expiredDeals = deals.filter((d) => d.status === "expired");

  return { deals, activeDeals, expiredDeals, lockDeal, userOffers, createUserOffer };
}
