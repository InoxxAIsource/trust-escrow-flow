import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Lock, CheckCircle, Users, TrendingUp, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";

const stats = [
  { label: "Trades Completed", value: "12,400+", icon: TrendingUp },
  { label: "Funds Secured", value: "$8.5M+", icon: Lock },
  { label: "Active Traders", value: "3,200+", icon: Users },
  { label: "Average Rating", value: "4.9/5", icon: Star },
];

const steps = [
  { step: 1, title: "Create a Deal", description: "Set your terms — coin, amount, price, and payment method. Post it to the marketplace or start a private deal.", icon: Zap },
  { step: 2, title: "Lock Funds in Escrow", description: "The seller's crypto is locked securely in escrow. Neither party can access it until trade conditions are met.", icon: Lock },
  { step: 3, title: "Confirm & Release", description: "Once payment is confirmed, funds are released instantly. If there's an issue, our dispute system has you covered.", icon: CheckCircle },
];

const coins = [
  { name: "USDT", symbol: "Tether", color: "bg-emerald-100 text-emerald-700", buyHref: "/buy-usdt" },
  { name: "BTC", symbol: "Bitcoin", color: "bg-amber-100 text-amber-700", buyHref: "/buy-bitcoin" },
  { name: "ETH", symbol: "Ethereum", color: "bg-indigo-100 text-indigo-700", buyHref: "/buy-ethereum" },
  { name: "SOL", symbol: "Solana", color: "bg-purple-100 text-purple-700", buyHref: "/buy-solana" },
];

const testimonials = [
  { name: "Rahul S.", location: "India", text: "Bought USDT with UPI in under 5 minutes. The escrow system gave me complete confidence.", rating: 5 },
  { name: "James M.", location: "USA", text: "Finally a P2P platform where I don't have to worry about scams. The escrow protection is game-changing.", rating: 5 },
  { name: "Aisha K.", location: "UK", text: "Sold Ethereum through TrustP2P three times now. Always smooth, always safe. Great experience.", rating: 5 },
];

const fade = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Index = () => (
  <>
    <SEOHead
      title="TrustP2P — Trade Crypto Safely with Escrow Protection"
      description="TrustP2P is a secure P2P crypto escrow platform. Buy and sell USDT, BTC, ETH, and SOL safely with escrow protection."
      canonical="https://buysusdtp2p.com/"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "TrustP2P",
        url: "https://buysusdtp2p.com",
        description: "Secure P2P crypto escrow platform",
      }}
    />

    {/* Hero */}
    <section className="relative overflow-hidden bg-gradient-to-b from-accent/50 to-background py-20 md:py-28">
      <div className="container text-center">
        <motion.div initial="hidden" animate="visible" variants={fade} custom={0}>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Shield className="h-4 w-4" />
            Escrow-Protected P2P Trading
          </div>
        </motion.div>

        <motion.h1
          className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight max-w-3xl mx-auto"
          initial="hidden" animate="visible" variants={fade} custom={1}
        >
          Trade Crypto Safely with{" "}
          <span className="text-primary">Escrow Protection</span>
        </motion.h1>

        <motion.p
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          initial="hidden" animate="visible" variants={fade} custom={2}
        >
          Buy and sell USDT, Bitcoin, Ethereum, and Solana peer-to-peer. Every trade is secured by escrow — your funds are safe until you confirm.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
          initial="hidden" animate="visible" variants={fade} custom={3}
        >
          <Button size="lg" asChild>
            <Link to="/marketplace">
              Start Trading <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/how-it-works">How It Works</Link>
          </Button>
        </motion.div>
      </div>
    </section>

    {/* Stats */}
    <section className="py-12 border-b">
      <div className="container grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="text-center"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i}
          >
            <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl md:text-3xl font-display font-bold text-foreground">{stat.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </section>

    {/* How It Works */}
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">How It Works</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Three simple steps to trade crypto safely with escrow protection.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i}
            >
              <Card className="h-full text-center border-2 hover:border-primary/30 transition-colors">
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Step {step.step}</div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" asChild>
            <Link to="/how-it-works">Learn More <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>

    {/* Supported Coins */}
    <section className="py-16 bg-accent/30">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Trade Your Favorite Coins</h2>
          <p className="mt-3 text-muted-foreground">Buy and sell popular cryptocurrencies with escrow protection.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {coins.map((coin, i) => (
            <motion.div key={coin.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i}>
              <Link to={coin.buyHref}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex flex-col items-center py-6 px-4">
                    <div className={`w-12 h-12 rounded-full ${coin.color} flex items-center justify-center font-display font-bold text-sm mb-3`}>
                      {coin.name}
                    </div>
                    <div className="font-semibold text-foreground">{coin.symbol}</div>
                    <div className="text-xs text-primary mt-1">Buy Now →</div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Testimonials */}
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Trusted by Traders Worldwide</h2>
          <p className="mt-3 text-muted-foreground">See what our community says about TrustP2P.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">"{t.text}"</p>
                  <div className="text-sm font-medium text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.location}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold">Ready to Trade Safely?</h2>
        <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto">
          Join thousands of traders who trust TrustP2P for secure P2P crypto trading with escrow protection.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" variant="secondary" asChild>
            <Link to="/marketplace">Browse Marketplace</Link>
          </Button>
          <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
            <Link to="/signup">Create Account</Link>
          </Button>
        </div>
      </div>
    </section>
  </>
);

export default Index;
