import { Link } from "react-router-dom";
import { ArrowRight, DollarSign, Shield, Zap, Globe, BarChart3, RefreshCw } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function WhatIsUSDT() {
  return (
    <div className="container py-12 lg:py-16">
      <SEOHead
        title="What is USDT (Tether)? - P2PxBT Guide"
        description="A plain-language guide to USDT (Tether) - the most widely used stablecoin. Learn what it is, how it keeps its $1 peg, and how to buy or sell USDT peer-to-peer."
        canonical="https://p2pxbt.com/what-is-usdt"
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "What is USDT?", href: "/what-is-usdt" },
        ]}
      />

      <article className="mx-auto max-w-3xl">
        {/* Hero */}
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            What is USDT (Tether)?
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            USDT - commonly called Tether - is a stablecoin: a cryptocurrency pegged 1:1 to the
            US Dollar. One USDT is always worth approximately $1.00. It combines the speed and
            borderless nature of crypto with the price stability of the world's reserve currency,
            making it the most traded digital asset by volume.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/buy-usdt">
                Buy USDT on P2PxBT <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/how-it-works">How P2P Trading Works</Link>
            </Button>
          </div>
        </header>

        {/* Key properties */}
        <section className="mb-10">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-5">
            Why traders use USDT
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: <DollarSign className="h-5 w-5 text-primary" />,
                title: "Stable price",
                body: "USDT maintains a $1.00 peg, so you can hold value in crypto without exposure to the volatility of BTC, ETH or SOL.",
              },
              {
                icon: <Globe className="h-5 w-5 text-primary" />,
                title: "Borderless transfers",
                body: "Send USDT to any wallet address worldwide, 24/7, without bank approval, FX conversion or correspondent bank fees.",
              },
              {
                icon: <Zap className="h-5 w-5 text-primary" />,
                title: "Fast settlement",
                body: "USDT transactions settle in seconds to minutes depending on the blockchain network - far faster than international wire transfers.",
              },
              {
                icon: <BarChart3 className="h-5 w-5 text-primary" />,
                title: "Trading hub",
                body: "Crypto traders park profits in USDT between positions to avoid volatility, then redeploy when they spot an opportunity.",
              },
              {
                icon: <Shield className="h-5 w-5 text-primary" />,
                title: "Inflation hedge",
                body: "In markets with high local currency inflation, USDT gives savers access to dollar-denominated value without a US bank account.",
              },
              {
                icon: <RefreshCw className="h-5 w-5 text-primary" />,
                title: "Multi-chain",
                body: "USDT runs on Ethereum (ERC-20), Tron (TRC-20), Solana, Polygon and more - choose the network that suits your speed and fee needs.",
              },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="p-5 flex gap-3">
                  <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-1">{item.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How USDT keeps its peg */}
        <section className="mb-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">How USDT keeps its $1 peg</h2>
          <p className="text-muted-foreground leading-relaxed">
            Tether is an asset-backed stablecoin. For every USDT in circulation, Tether Ltd holds
            an equivalent amount in reserve - primarily US Treasury bills, cash and cash
            equivalents. When you redeem USDT through an authorised channel, Tether burns the
            tokens and releases the equivalent dollars from reserve.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            This backing mechanism keeps the market price anchored near $1.00. If USDT ever trades
            below $1 on an exchange, arbitrageurs buy it cheaply and redeem it at par, pushing
            the price back up. If it trades above $1, arbitrageurs mint new USDT and sell it,
            pulling the price down.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            On P2PxBT, the USDT price shown on each offer card reflects the local P2P rate -
            the premium or discount that counterparties apply over the 1:1 dollar reference price,
            based on local supply, demand and payment method.
          </p>
        </section>

        {/* USDT vs BTC */}
        <section className="mb-10">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">USDT vs Bitcoin - which should I buy?</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Factor</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">USDT</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Bitcoin (BTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Price volatility", "Very low - pegged to $1", "High - moves with market"],
                  ["Use case", "Savings, transfers, trading hub", "Long-term store of value"],
                  ["Supply", "Elastic - minted on demand", "Fixed at 21 million BTC"],
                  ["Counterparty risk", "Depends on Tether's reserves", "None - fully decentralised"],
                  ["Best for", "Holding value in dollar terms", "Long-term appreciation"],
                ].map(([factor, usdt, btc]) => (
                  <tr key={factor}>
                    <td className="px-4 py-3 font-medium text-foreground">{factor}</td>
                    <td className="px-4 py-3 text-muted-foreground">{usdt}</td>
                    <td className="px-4 py-3 text-muted-foreground">{btc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Many traders hold both: BTC for long-term appreciation and USDT as a liquid, stable
            reserve ready to deploy when prices dip.
          </p>
        </section>

        {/* USDT networks */}
        <section className="mb-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">Choosing a USDT network</h2>
          <p className="text-muted-foreground leading-relaxed">
            USDT exists on several blockchains. The two most common are:
          </p>
          <ul className="space-y-3">
            {[
              { title: "ERC-20 (Ethereum)", body: "The original USDT network. Widely supported across all exchanges and wallets. Transaction fees (gas) can be high during busy periods." },
              { title: "TRC-20 (Tron)", body: "Very low fees and fast confirmations. Extremely popular for exchange withdrawals and P2P transfers across Asia, Africa and Latin America." },
              { title: "SPL (Solana)", body: "The fastest and cheapest option for USDT. Growing support across exchanges. Ideal for high-frequency trading." },
              { title: "Polygon (MATIC)", body: "A low-cost Ethereum sidechain. Good for DeFi applications and wallets that support Polygon." },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                <span className="text-sm leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">{item.title} - </strong>
                  {item.body}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Always confirm the network with the sender or exchange before withdrawing - sending
            ERC-20 USDT to a TRC-20 address will result in loss of funds.
          </p>
        </section>

        {/* How to buy on P2PxBT */}
        <section className="mb-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">Buy USDT on P2PxBT</h2>
          <ol className="space-y-3">
            {[
              { step: "1", text: "Create an account and complete identity verification." },
              { step: "2", text: "Go to the marketplace and filter by USDT, your country and preferred payment method." },
              { step: "3", text: "Choose a counterparty and enter the amount you want to buy." },
              { step: "4", text: "Open the trade - a P2PxBT operator sends wire payment details into the trade chat." },
              { step: "5", text: "Send a physical bank wire, upload your receipt, and mark payment as sent. USDT is released to your wallet once confirmed." },
            ].map((item) => (
              <li key={item.step} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                  {item.step}
                </span>
                {item.text}
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/marketplace">Browse USDT Offers <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/buy-usdt-usa">Buy USDT in USA</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/buy-usdt-uk">Buy USDT in UK</Link>
            </Button>
          </div>
        </section>

        {/* Related */}
        <section className="rounded-lg border border-border bg-muted/40 p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">Related guides</h3>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {[
              { label: "What is Bitcoin?", href: "/what-is-bitcoin" },
              { label: "How P2P trading works", href: "/how-it-works" },
              { label: "Wire transfer guide", href: "/wire-transfer-guide" },
              { label: "Live crypto prices", href: "/crypto-prices" },
              { label: "Buy USDT in USA", href: "/buy-usdt-usa" },
              { label: "Buy USDT in UK", href: "/buy-usdt-uk" },
              { label: "Fees", href: "/fees" },
              { label: "FAQ", href: "/faq" },
            ].map((l) => (
              <li key={l.href}>
                <Link to={l.href} className="text-muted-foreground hover:text-foreground transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}
