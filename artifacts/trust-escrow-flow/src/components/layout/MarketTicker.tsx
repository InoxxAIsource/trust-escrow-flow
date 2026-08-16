import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  useLivePrices,
  formatTickerPrice,
  formatChange,
  TICKER_ASSETS,
  type LivePrice,
} from "@/hooks/use-live-prices";

/**
 * Horizontal market ticker that runs across the top of every page.
 *
 * The strip scrolls continuously by translating a duplicated track, which is
 * the only way to loop seamlessly: the second copy is identical, so when the
 * first has moved exactly its own width the frame is indistinguishable from
 * the start and the animation can reset with no visible jump.
 *
 * Restraint on purpose. The reference for this pattern is a crypto-screener
 * bar, which tends to be loud; this one is a hairline strip in the page's own
 * palette, so it reads as a market feed rather than a casino marquee.
 */
/** See the seamless-loop note in the track below for why this is 3. */
const REPEATS_PER_HALF = 3;

export function MarketTicker() {
  const { data: prices, isError } = useLivePrices();
  const reduce = useReducedMotion();

  // Nothing useful to show yet, and a half-empty bar is worse than no bar.
  if (isError || !prices || prices.length === 0) return null;

  return (
    <div
      className="border-b border-border bg-card"
      // The strip is decorative repetition of data available elsewhere, so it
      // is announced once rather than read as a list of links.
      aria-label="Live market prices"
    >
      <div
        className={cn(
          "relative flex overflow-hidden",
          // Fade the edges so items enter and leave rather than being cut.
          "[mask-image:linear-gradient(to_right,transparent,black_3rem,black_calc(100%-3rem),transparent)]",
        )}
      >
        {/*
          Under reduced motion the track does not animate. It stays a plain
          horizontally scrollable strip, so the information is still reachable
          without any movement at all.
        */}
        {reduce ? (
          <div className="flex gap-6 overflow-x-auto px-4 py-2">
            {prices.map((price) => (
              <TickerItem key={price.symbol} price={price} />
            ))}
          </div>
        ) : (
          <div className="flex w-max animate-ticker gap-6 py-2 hover:[animation-play-state:paused]">
            {/*
              Two halves, each repeating the list REPEATS_PER_HALF times.

              The animation shifts by exactly half the track, so the visible
              window never runs past the end only if half the track is at
              least as wide as the viewport. Five assets render around 770px,
              which is narrower than a desktop viewport and would leave a gap
              on the right. Repeating three times per half puts each half over
              2300px, clearing any realistic screen.
            */}
            {[0, 1].map((half) => (
              <div key={half} className="flex shrink-0 gap-6 px-3" aria-hidden={half === 1}>
                {Array.from({ length: REPEATS_PER_HALF }).map((_, repeat) =>
                  prices.map((price) => (
                    <TickerItem key={`${half}-${repeat}-${price.symbol}`} price={price} />
                  )),
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TickerItem({ price }: { price: LivePrice }) {
  const up = (price.change24h ?? 0) > 0;
  const down = (price.change24h ?? 0) < 0;

  const body = (
    <>
      <span className="font-mono text-[11px] font-medium text-foreground">{price.symbol}</span>
      <span className="font-mono text-[11px] text-muted-foreground">
        {formatTickerPrice(price.usd)}
      </span>
      {price.change24h !== null && (
        <span
          className={cn(
            "font-mono text-[11px]",
            up && "text-success",
            down && "text-destructive",
            !up && !down && "text-muted-foreground",
          )}
        >
          {formatChange(price.change24h)}
        </span>
      )}
    </>
  );

  // BNB is reference only. It is shown, but it does not link anywhere,
  // because the platform does not trade it.
  return price.tradeable ? (
    <Link
      to="/marketplace"
      className="flex shrink-0 items-baseline gap-2 rounded px-1 transition-colors hover:bg-accent/50"
    >
      {body}
    </Link>
  ) : (
    <span className="flex shrink-0 items-baseline gap-2 px-1">{body}</span>
  );
}

export { TICKER_ASSETS };
