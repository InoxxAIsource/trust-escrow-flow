import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import { cn } from "@/lib/utils";
import { MARKET_REGIONS } from "@/lib/pricing";

/* ---------------------------------------------------------------------------
   Landing page.

   Institutional read: restrained motion, one accent, hairlines instead of
   card soup, monospace for every figure.

   Note for anyone editing the copy here. The counterparties, prices and trade
   counts this page advertises are seeded, and no transfer is processed. The
   standing disclosure of that now lives in the footer rather than on every
   surface, so it is the only thing on the marketing pages carrying it. Do not
   remove it, and keep the notices at the payment-details message, the
   completion receipt and the KYC upload step, which are the points where
   someone could act on a false belief and lose money.
--------------------------------------------------------------------------- */

const marketStats = [
  { label: "Verified counterparties", value: "126" },
  { label: "Markets", value: "4" },
  { label: "Assets", value: "4" },
  { label: "Seller premium", value: "4.0-6.0%" },
];

const steps = [
  {
    title: "Verify your identity",
    body: "Submit an ID, a proof of address and a selfie. An operator reviews it. You cannot approve yourself, and the database enforces that, not the interface.",
  },
  {
    title: "Choose a counterparty",
    body: "Each seller quotes its own spread over the live reference price, so the listing is a real range of competing prices rather than one number.",
  },
  {
    title: "Wait for payment details",
    body: "Selecting a method shows you nothing. Instructions are readable only by an operator, so the wait is enforced rather than staged.",
  },
  {
    title: "Settle",
    body: "Mark the payment sent and the operator confirms it against the reference. The trade closes and the full timeline stays on record.",
  },
];

const assets = [
  { symbol: "BTC", name: "Bitcoin", href: "/buy-bitcoin" },
  { symbol: "ETH", name: "Ethereum", href: "/buy-ethereum" },
  { symbol: "SOL", name: "Solana", href: "/buy-solana" },
  { symbol: "USDT", name: "Tether", href: "/buy-usdt" },
];

const marketRails: Record<string, string> = {
  US: "Bank Wire, ACH",
  UK: "Faster Payments",
  EU: "SEPA",
  HK: "FPS",
};

const Index = () => {
  const reduce = useReducedMotion();
  const [imageFailed, setImageFailed] = useState(false);

  // MOTION_INTENSITY 3: entry fade only, no scroll choreography. A financial
  // product that animates a lot reads as a toy.
  const enter = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  const reveal = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.3 },
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <>
      <SEOHead
        title="P2PxBT - Peer-to-Peer Crypto Trading"
        description="Buy and sell BTC, ETH, SOL and USDT peer-to-peer across the US, UK, Europe and Hong Kong, on local payment rails."
        canonical="https://p2pxbt.com/"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "P2PxBT",
            url: "https://p2pxbt.com",
            logo: "https://p2pxbt.com/favicon.ico",
            sameAs: [],
          },
        ]}
      />

      {/* ── Hero: asymmetric split, order book on the right ─────────────── */}
      <section className="border-b border-border">
        <div className="container grid grid-cols-1 gap-12 pb-16 pt-16 lg:grid-cols-12 lg:gap-16 lg:pb-24 lg:pt-24">
          <div className="lg:col-span-6">
            <motion.p
              {...enter(0)}
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
            >
              US · UK · Europe · Hong Kong
            </motion.p>

            <motion.h1
              {...enter(0.06)}
              /* Scale is planned against the column width: at lg the text column
                 is 6/12, which fits "A peer-to-peer desk," on one line at 5xl.
                 Going larger pushes the headline to three lines. */
              className="mt-5 font-display text-[2rem] font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-5xl"
            >
              A peer-to-peer desk,
              {/* The forced break only helps once the line actually fits; on
                  narrow screens it just adds a fourth line. */}
              <br className="hidden sm:inline" />{" "}
              running end to end.
            </motion.h1>

            <motion.p
              {...enter(0.12)}
              className="mt-6 max-w-[52ch] text-base leading-relaxed text-muted-foreground md:text-lg"
            >
              Verified counterparties, competing quotes, and payment details issued by an
              operator on your local rails. Four assets, four markets, one workflow.
            </motion.p>

            <motion.div {...enter(0.18)} className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="px-6">
                <Link to="/marketplace">
                  Open the marketplace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-6">
                <Link to="/how-it-works">How it works</Link>
              </Button>
            </motion.div>
          </div>

          {/* Live prices now run in the ticker strip above the header, so the
              hero panel is the artwork alone. */}
          <motion.figure
            {...enter(0.24)}
            className="overflow-hidden rounded-lg border border-border bg-card lg:col-span-6 lg:col-start-7"
          >
            <img
              src="/hero-assets.jpg"
              alt="Bitcoin, Ethereum, Tether and Solana coins arranged on a dark surface"
              width={736}
              height={1104}
              /* Above the fold, so it is the LCP element and must not be lazy. */
              loading="eager"
              decoding="async"
              onError={() => setImageFailed(true)}
              className={cn(
                "aspect-[4/3] w-full bg-[#111417] object-contain",
                imageFailed && "hidden",
              )}
            />
            <figcaption className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              Four assets, four markets.
            </figcaption>
          </motion.figure>
        </div>
      </section>

      {/* ── Figures: hairline row, no cards ─────────────────────────────── */}
      <section className="border-b border-border bg-muted/30">
        <div className="container grid grid-cols-2 divide-x divide-border lg:grid-cols-4">
          {marketStats.map((stat) => (
            <div key={stat.label} className="px-2 py-8 first:pl-0 sm:px-6">
              <p className="font-mono text-2xl font-medium text-foreground md:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Workflow: numbered rail, vertical stack ─────────────────────── */}
      <section className="border-b border-border">
        <div className="container py-16 lg:py-24">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              How a trade runs
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every gate below is enforced server-side, which is why no step can be skipped and no
              party can move a trade on their own.
            </p>
          </div>

          <ol className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
            {steps.map((step, i) => (
              <motion.li key={step.title} {...reveal} className="bg-card p-6 lg:p-8">
                <span className="font-mono text-xs text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Markets: horizontal band ────────────────────────────────────── */}
      <section className="border-b border-border bg-muted/30">
        <div className="container py-16 lg:py-20">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Four markets, local rails
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {MARKET_REGIONS.map((region) => (
              <Link
                key={region.code}
                to="/marketplace"
                className="group bg-card p-6 transition-colors hover:bg-accent/40"
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{region.code}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <p className="mt-4 font-display text-lg font-semibold text-foreground">
                  {region.label}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{marketRails[region.code]}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Assets: inline list, deliberately light ─────────────────────── */}
      <section className="border-b border-border">
        <div className="container flex flex-col gap-8 py-16 lg:flex-row lg:items-center lg:justify-between lg:py-20">
          <div className="max-w-md">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Trade four assets
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Each one quoted by every counterparty that supports it, so a listing is a spread of
              competing prices rather than a single number.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {assets.map((asset) => (
              <Link
                key={asset.symbol}
                to={asset.href}
                className="group flex items-baseline gap-2 rounded-lg border border-border bg-card px-4 py-2.5 transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <span className="font-mono text-sm font-medium text-foreground">
                  {asset.symbol}
                </span>
                <span className="text-sm text-muted-foreground">{asset.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How the desk operates ───────────────────────────────────────── */}
      <section className="border-b border-border bg-muted/30">
        <div className="container py-16 lg:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                How the desk operates
              </h2>
            </div>

            <div className="lg:col-span-7">
              <dl className="space-y-5">
                {[
                  ["Operator-issued details", "Payment instructions are never published on a listing. An operator reviews the trade and sends them into the chat, so they only exist once a trade is open."],
                  ["Verification before trading", "Identity documents are reviewed by an operator before a first trade. Nobody can approve their own application."],
                  ["Server-enforced lifecycle", "A trade moves only through validated transitions. Neither side can advance or complete one on their own."],
                  ["Private by default", "Documents sit in private storage behind short-lived signed links. Trades and chats are readable only by their participants."],
                ].map(([term, def]) => (
                  <motion.div key={term} {...reveal} className="border-t border-border pt-5">
                    <dt className="font-display font-semibold text-foreground">{term}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{def}</dd>
                  </motion.div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ── Close ───────────────────────────────────────────────────────── */}
      <section>
        <div className="container py-20 text-center lg:py-28">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Start where a real buyer would
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Browse the book, pick a counterparty, and see how far you get before the workflow
            asks something of you.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="px-8">
              <Link to="/marketplace">
                Open the marketplace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;
