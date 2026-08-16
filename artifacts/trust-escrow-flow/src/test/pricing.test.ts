import { describe, it, expect } from "vitest";
import {
  quote,
  orderTotal,
  formatSpread,
  formatBpsRange,
  formatAssetAmount,
  formatUsd,
  formatMoney,
  round2,
  DEMO_ASSETS,
  MARKET_REGIONS,
  CURRENCIES,
  CURRENCY_BY_REGION,
  FALLBACK_MARKET_PRICES,
  BUY_PREMIUM_BPS_MIN,
  BUY_PREMIUM_BPS_MAX,
  SELL_DISCOUNT_BPS_MIN,
  SELL_DISCOUNT_BPS_MAX,
  type DemoAsset,
} from "@/lib/pricing";

describe("quote()", () => {
  it("applies a seller's own premium on the buy side", () => {
    // 412 bps = 4.12%
    const q = quote("BUY", 100_000, 412);
    expect(q.p2pPrice).toBeCloseTo(104_120, 6);
    expect(q.spreadLabel).toBe("+4.12%");
  });

  it("applies a buyer's own discount on the sell side", () => {
    const q = quote("SELL", 100_000, 215);
    expect(q.p2pPrice).toBeCloseTo(97_850, 6);
    expect(q.spreadLabel).toBe("−2.15%");
  });

  it("prices the 4%-6% band correctly at both ends", () => {
    expect(quote("BUY", 100_000, BUY_PREMIUM_BPS_MIN).p2pPrice).toBeCloseTo(104_000, 6);
    expect(quote("BUY", 100_000, BUY_PREMIUM_BPS_MAX).p2pPrice).toBeCloseTo(106_000, 6);
  });

  it("prices the 2%-4% sell band correctly at both ends", () => {
    expect(quote("SELL", 100_000, SELL_DISCOUNT_BPS_MIN).p2pPrice).toBeCloseTo(98_000, 6);
    expect(quote("SELL", 100_000, SELL_DISCOUNT_BPS_MAX).p2pPrice).toBeCloseTo(96_000, 6);
  });

  it("keeps buy above and sell below mid for every asset in every currency", () => {
    for (const currency of CURRENCIES) {
      for (const asset of DEMO_ASSETS) {
        const mid = FALLBACK_MARKET_PRICES[currency][asset];
        expect(mid, `${currency} ${asset} has no fallback price`).toBeGreaterThan(0);

        for (const bps of [BUY_PREMIUM_BPS_MIN, 500, BUY_PREMIUM_BPS_MAX]) {
          expect(quote("BUY", mid, bps).p2pPrice).toBeGreaterThan(mid);
        }
        for (const bps of [SELL_DISCOUNT_BPS_MIN, 300, SELL_DISCOUNT_BPS_MAX]) {
          expect(quote("SELL", mid, bps).p2pPrice).toBeLessThan(mid);
        }
      }
    }
  });
});

describe("currency", () => {
  it("maps every region to a currency", () => {
    for (const region of MARKET_REGIONS) {
      expect(CURRENCY_BY_REGION[region.code], `${region.code} has no currency`).toBeTruthy();
    }
  });

  it("formats each currency with its own symbol", () => {
    expect(formatMoney(1234.5, "USD")).toContain("$");
    expect(formatMoney(1234.5, "GBP")).toContain("£");
    expect(formatMoney(1234.5, "EUR")).toContain("€");
    expect(formatMoney(1234.5, "HKD")).toContain("HK$");
  });

  it("carries a fallback price for every currency and asset", () => {
    // A missing pair would render a free trade if the live feed were down.
    for (const currency of CURRENCIES) {
      for (const asset of DEMO_ASSETS) {
        expect(FALLBACK_MARKET_PRICES[currency]?.[asset]).toBeGreaterThan(0);
      }
    }
  });

  it("produces different prices for different sellers on the same asset", () => {
    // This is the point of per-counterparty spreads: visible competition.
    const cheap = quote("BUY", 100_000, 412).p2pPrice;
    const dear = quote("BUY", 100_000, 587).p2pPrice;
    expect(cheap).toBeLessThan(dear);
    expect(dear - cheap).toBeCloseTo(1_750, 6);
  });

  it("is deterministic — the same inputs always give the same price", () => {
    const a = quote("BUY", 100_000, 455);
    const b = quote("BUY", 100_000, 455);
    expect(a.p2pPrice).toBe(b.p2pPrice);
    expect(a.spreadLabel).toBe(b.spreadLabel);
  });

  it("preserves the reference price it was handed", () => {
    expect(quote("BUY", 3_500, 500).marketPrice).toBe(3_500);
  });

  // A zero or NaN mid price would silently render a free trade, so it must throw.
  it.each([0, -1, NaN, Infinity])("rejects an unusable market price (%s)", (bad) => {
    expect(() => quote("BUY", bad as number, 500)).toThrow(/positive number/);
  });

  it.each([NaN, -1, Infinity])("rejects an unusable spread (%s)", (bad) => {
    expect(() => quote("BUY", 100_000, bad as number)).toThrow(/spreadBps/);
  });
});

describe("orderTotal()", () => {
  it("multiplies amount by unit price", () => {
    expect(orderTotal(0.5, 104_120)).toBe(52_060);
  });

  it("rounds to cents so the client agrees with the database check", () => {
    expect(orderTotal(3, 33.333)).toBe(100);
    expect(orderTotal(1, 0.005)).toBe(0.01);
  });

  it.each([
    [0, 100],
    [-1, 100],
    [1, 0],
    [1, -5],
  ])("rejects non-positive inputs (%s, %s)", (amount, price) => {
    expect(() => orderTotal(amount, price)).toThrow();
  });
});

describe("formatSpread() / formatBpsRange()", () => {
  it("signs positive and negative spreads", () => {
    expect(formatSpread(0.0412)).toBe("+4.12%");
    expect(formatSpread(-0.0215)).toBe("−2.15%");
    expect(formatSpread(0)).toBe("0.00%");
  });

  it("renders the reference bands", () => {
    expect(formatBpsRange(BUY_PREMIUM_BPS_MIN, BUY_PREMIUM_BPS_MAX)).toBe("4.00% – 6.00%");
    expect(formatBpsRange(SELL_DISCOUNT_BPS_MIN, SELL_DISCOUNT_BPS_MAX)).toBe("2.00% – 4.00%");
  });
});

describe("round2()", () => {
  it("handles the classic float artefact", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});

describe("formatting helpers", () => {
  it("formats USD to two decimals", () => {
    expect(formatUsd(105_000)).toBe("$105,000.00");
  });

  it("gives each asset appropriate precision", () => {
    expect(formatAssetAmount(0.000425, "BTC")).toBe("0.000425");
    expect(formatAssetAmount(250_000, "USDT")).toBe("250,000");
    expect(formatAssetAmount(1850.5, "SOL")).toBe("1,850.5");
  });

  it("covers every supported asset", () => {
    for (const asset of DEMO_ASSETS) {
      expect(() => formatAssetAmount(1.23456789, asset as DemoAsset)).not.toThrow();
    }
  });
});

describe("market regions", () => {
  it("covers US, UK, Europe and Hong Kong", () => {
    expect(MARKET_REGIONS.map((r) => r.code)).toEqual(["US", "UK", "EU", "HK"]);
  });

  it("does not offer any market the roster no longer seeds", () => {
    // Guards against a region being added to the picker without counterparties.
    const labels = MARKET_REGIONS.map((r) => r.label).join(" ");
    expect(labels).not.toMatch(/India|Nigeria|Philippines|UAE/i);
  });
});
