import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Globe, Lock, TrendingUp, RefreshCw } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function WhatIsBitcoin() {
  return (
    <div className="container py-12 lg:py-16">
      <SEOHead
        title="What is Bitcoin (BTC)? — P2PxBT Guide"
        description="A clear, jargon-free guide to Bitcoin — what it is, how it works, why people use it, and how to buy or sell BTC peer-to-peer on P2PxBT."
        canonical="https://p2pxbt.com/what-is-bitcoin"
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "What is Bitcoin?", href: "/what-is-bitcoin" },
        ]}
      />

      <article className="mx-auto max-w-3xl">
        {/* Hero */}
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            What is Bitcoin (BTC)?
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Bitcoin is the world's first decentralised digital currency. Created in 2009, it lets
            people send and receive value across borders — without a bank, government or
            intermediary involved. It runs on a public ledger called the blockchain, secured by
            a global network of computers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/buy-bitcoin">
                Buy Bitcoin on P2PxBT <ArrowRight className="ml-2 h-4 w-4" />
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
            Key properties of Bitcoin
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: <Lock className="h-5 w-5 text-primary" />,
                title: "Decentralised",
                body: "No single company, bank or government controls Bitcoin. It is maintained by thousands of independent nodes worldwide.",
              },
              {
                icon: <Globe className="h-5 w-5 text-primary" />,
                title: "Borderless",
                body: "A Bitcoin transaction reaches anywhere on Earth in minutes, regardless of banking hours or international wire restrictions.",
              },
              {
                icon: <Shield className="h-5 w-5 text-primary" />,
                title: "Secure",
                body: "Transactions are cryptographically signed and recorded permanently on the blockchain. Confirmed payments cannot be reversed or altered.",
              },
              {
                icon: <TrendingUp className="h-5 w-5 text-primary" />,
                title: "Fixed supply",
                body: "Only 21 million BTC will ever exist. New coins are released on a predictable schedule that halves roughly every four years.",
              },
              {
                icon: <Zap className="h-5 w-5 text-primary" />,
                title: "Programmable",
                body: "Bitcoin supports scripting that enables time-locks, multi-signature wallets and payment channels like the Lightning Network.",
              },
              {
                icon: <RefreshCw className="h-5 w-5 text-primary" />,
                title: "Transparent",
                body: "Every transaction is visible on the public blockchain. Anyone can verify balances and payment history without trusting a third party.",
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

        {/* How it works */}
        <section className="mb-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">How Bitcoin works</h2>
          <p className="text-muted-foreground leading-relaxed">
            When you send Bitcoin, you broadcast a signed message to the network stating that a
            certain amount of BTC should move from your address to another. Miners — computers
            running specialised software — collect these messages, verify they are valid (that
            you actually own the coins you're sending), and bundle them into a block.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Each block is cryptographically chained to the one before it, forming the
            "blockchain." To alter a past transaction an attacker would need to redo the
            computational work for that block and every block after it — a task that becomes
            exponentially harder as the chain grows. This makes confirmed Bitcoin transactions
            effectively irreversible.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Miners are rewarded with newly created BTC and transaction fees for their work. The
            reward halves every 210,000 blocks (roughly every four years) — a built-in mechanism
            that controls inflation and enforces the 21 million cap.
          </p>
        </section>

        {/* Why people use Bitcoin */}
        <section className="mb-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">Why people use Bitcoin</h2>
          <ul className="space-y-3">
            {[
              { title: "Store of value", body: "Many holders treat BTC as a long-term savings asset, similar to gold, because its supply is capped and its issuance schedule is predictable." },
              { title: "Cross-border payments", body: "Sending value internationally with Bitcoin bypasses correspondent banking fees and can settle in under an hour, regardless of the destination country." },
              { title: "Financial access", body: "Anyone with a smartphone and an internet connection can hold and send Bitcoin, without a bank account or government-issued ID." },
              { title: "Hedge against inflation", body: "In economies with high monetary inflation, Bitcoin's fixed supply makes it attractive as an alternative to depreciating local currency." },
              { title: "P2P trading", body: "Platforms like P2PxBT let individuals buy and sell Bitcoin directly with each other using local payment methods, getting competitive rates without exchange fees." },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                <span className="text-sm leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">{item.title} — </strong>
                  {item.body}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Bitcoin vs traditional money */}
        <section className="mb-10">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
            Bitcoin vs traditional money
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Feature</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Bitcoin</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Bank money</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Controlled by", "No one (protocol rules)", "Central bank / government"],
                  ["Supply limit", "21 million BTC, fixed", "Unlimited — set by policy"],
                  ["Settlement time", "10–60 minutes on-chain", "1–5 business days (international)"],
                  ["Reversibility", "Irreversible once confirmed", "Chargebacks / recalls possible"],
                  ["Access", "Anyone with internet", "Requires bank account"],
                  ["Transparency", "Public blockchain", "Private ledger"],
                ].map(([feature, btc, bank]) => (
                  <tr key={feature}>
                    <td className="px-4 py-3 font-medium text-foreground">{feature}</td>
                    <td className="px-4 py-3 text-muted-foreground">{btc}</td>
                    <td className="px-4 py-3 text-muted-foreground">{bank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* How to buy on P2PxBT */}
        <section className="mb-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            How to buy Bitcoin on P2PxBT
          </h2>
          <ol className="space-y-3">
            {[
              { step: "1", text: "Create a free account and complete identity verification." },
              { step: "2", text: "Browse the marketplace for a BTC seller in your region and payment method." },
              { step: "3", text: "Enter the amount, review the P2P price, and open the trade." },
              { step: "4", text: "A P2PxBT operator sends bank details into the trade chat. Send your wire payment — physical wire only." },
              { step: "5", text: "Upload your payment receipt. The operator confirms and releases Bitcoin to your wallet." },
            ].map((item) => (
              <li key={item.step} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                  {item.step}
                </span>
                {item.text}
              </li>
            ))}
          </ol>
          <div className="mt-4">
            <Button asChild>
              <Link to="/marketplace">Browse Bitcoin Offers <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>

        {/* Related */}
        <section className="rounded-lg border border-border bg-muted/40 p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">Related guides</h3>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {[
              { label: "What is USDT?", href: "/what-is-usdt" },
              { label: "How P2P trading works", href: "/how-it-works" },
              { label: "Wire transfer guide", href: "/wire-transfer-guide" },
              { label: "Buy Bitcoin in USA", href: "/buy-bitcoin-usa" },
              { label: "Buy Bitcoin in UK", href: "/buy-bitcoin-uk" },
              { label: "Live crypto prices", href: "/crypto-prices" },
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
