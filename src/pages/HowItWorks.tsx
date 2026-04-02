import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock, CheckCircle, MessageSquare, Clock, AlertTriangle, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOHead from "@/components/SEOHead";

const steps = [
  { icon: Zap, title: "1. Create a Deal", desc: "The buyer or seller creates a deal by setting the coin, amount, price, and accepted payment methods. The deal is posted to the marketplace or shared privately." },
  { icon: Lock, title: "2. Funds Locked in Escrow", desc: "The seller's cryptocurrency is locked in a secure escrow wallet. Neither party can access these funds until the trade conditions are satisfied." },
  { icon: MessageSquare, title: "3. Communicate & Pay", desc: "Buyer and seller communicate via the built-in chat. The buyer sends payment through the agreed method (UPI, bank transfer, PayPal, etc.)." },
  { icon: CheckCircle, title: "4. Confirm & Release", desc: "The seller confirms receipt of payment and releases the crypto from escrow. The buyer receives their cryptocurrency instantly." },
  { icon: AlertTriangle, title: "5. Dispute Resolution", desc: "If any issue arises, either party can raise a dispute. Our moderators review the evidence and make a fair decision." },
  { icon: Clock, title: "6. Auto-Protection", desc: "Time-locked trades auto-cancel if the buyer doesn't pay within the window. Auto-release options are available for trusted traders." },
];

const faqs = [
  { q: "What is crypto escrow?", a: "Crypto escrow is a service that holds cryptocurrency in a secure, neutral account during a P2P trade. Funds are only released when both parties fulfill their obligations." },
  { q: "How long does a trade take?", a: "Most trades complete within 5-15 minutes. The escrow system ensures speed while maintaining security." },
  { q: "What happens if there's a dispute?", a: "Either party can raise a dispute. Our experienced moderators review all evidence including chat history and payment proofs to make a fair decision." },
  { q: "Which cryptocurrencies are supported?", a: "We currently support USDT (Tether), Bitcoin (BTC), Ethereum (ETH), and Solana (SOL) with more coming soon." },
  { q: "Is my money safe?", a: "Yes. Funds are locked in escrow and cannot be accessed by either party until trade conditions are met. Our dispute system provides an additional safety net." },
];

const fade = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }) };

const HowItWorks = () => (
  <>
    <SEOHead title="How TrustP2P Works — Secure P2P Crypto Escrow" description="Learn how TrustP2P's escrow system protects your P2P crypto trades. Step-by-step guide to safe cryptocurrency trading." canonical="https://buysusdtp2p.com/how-it-works" />

    <div className="container py-12">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "How It Works", href: "/how-it-works" }]} />

      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
          <Shield className="h-4 w-4" />
          Escrow Protection
        </div>
        <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground">How TrustP2P Works</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Our multi-step escrow system ensures every trade is safe, transparent, and fair for both buyers and sellers.
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-3xl mx-auto space-y-6 mb-16">
        {steps.map((step, i) => (
          <motion.div key={step.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i}>
            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardContent className="flex gap-4 py-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex-shrink-0 flex items-center justify-center">
                  <step.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i}>
              <Card>
                <CardContent className="py-5">
                  <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="text-center mt-12">
        <Button size="lg" asChild>
          <Link to="/marketplace">Start Trading Now</Link>
        </Button>
      </div>
    </div>
  </>
);

export default HowItWorks;
