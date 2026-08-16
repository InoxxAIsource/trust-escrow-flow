import { Link } from "react-router-dom";
import { ArrowRight, Clock, FileText, AlertTriangle, CheckCircle, Building2, Globe } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function WireTransferGuide() {
  return (
    <div className="container py-12 lg:py-16">
      <SEOHead
        title="Bank Wire Transfer Guide for P2P Crypto - P2PxBT"
        description="A complete guide to sending a bank wire transfer when buying or selling cryptocurrency on P2PxBT. Covers domestic wires, SWIFT, SEPA, Faster Payments and what to do after payment."
        canonical="https://p2pxbt.com/wire-transfer-guide"
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Wire Transfer Guide", href: "/wire-transfer-guide" },
        ]}
      />

      <article className="mx-auto max-w-3xl">
        {/* Hero */}
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Bank Wire Transfer Guide
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            All payments on P2PxBT are made via physical bank wire - no third-party apps, no
            online payment platforms. This guide explains how to send a wire correctly, what
            details you need, and how to upload your receipt so the operator can release your
            crypto promptly.
          </p>
        </header>

        {/* Why wire only */}
        <section className="mb-10">
          <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-4 mb-6">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-sm">
              <p className="font-semibold text-foreground mb-1">Physical wire only</p>
              <p className="text-muted-foreground">
                P2PxBT does not accept PayPal, Revolut, Wise, Venmo, Zelle, Cash App, or any
                other online payment platform. Payment must be a direct bank-to-bank wire transfer
                sent from your own bank account. Trades paid by any other method will not be
                confirmed.
              </p>
            </div>
          </div>

          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Why wire transfers?</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Wire transfers are the most reliable, traceable and fraud-resistant payment method for
            large-value P2P crypto transactions. Unlike card payments or online transfers, a bank
            wire creates a clear audit trail that ties your bank account to the payment reference -
            making dispute resolution straightforward if anything goes wrong.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Bank wires are also non-reversible once sent, which aligns with how crypto settlement
            works: once both sides of the trade are confirmed, neither party can unilaterally
            reverse the transaction.
          </p>
        </section>

        {/* Payment methods by region */}
        <section className="mb-10">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Payment rails by region</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: <Building2 className="h-5 w-5 text-primary" />,
                region: "United States",
                methods: ["USA Bank Wire (domestic)", "ACH Transfer"],
                details: "Domestic wires settle same day if sent before your bank's cut-off. ACH takes 1–3 business days.",
              },
              {
                icon: <Globe className="h-5 w-5 text-primary" />,
                region: "United Kingdom",
                methods: ["UK Faster Payments", "CHAPS"],
                details: "Faster Payments settle almost instantly (under 2 hours). CHAPS is same-day but may carry a fee.",
              },
              {
                icon: <Globe className="h-5 w-5 text-primary" />,
                region: "Europe (SEPA)",
                methods: ["SEPA Credit Transfer", "SEPA Instant"],
                details: "Standard SEPA settles next business day. SEPA Instant settles within 10 seconds if both banks support it.",
              },
              {
                icon: <Globe className="h-5 w-5 text-primary" />,
                region: "Hong Kong",
                methods: ["FPS (Faster Payment System)", "Bank Transfer"],
                details: "Hong Kong FPS settles in real time, 24/7, including weekends and public holidays.",
              },
              {
                icon: <Globe className="h-5 w-5 text-primary" />,
                region: "International",
                methods: ["SWIFT Wire"],
                details: "Used for cross-border wires between countries not sharing a regional network. Typically 1–3 business days.",
              },
            ].map((item) => (
              <Card key={item.region}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    {item.icon}
                    <p className="font-semibold text-foreground text-sm">{item.region}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.methods.map((m) => (
                      <span key={m} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{m}</span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.details}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Step by step */}
        <section className="mb-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Step-by-step: sending a wire for your P2PxBT trade
          </h2>
          <ol className="space-y-4">
            {[
              {
                step: "1",
                title: "Open your trade",
                body: "Go to the marketplace, select a counterparty, enter an amount and choose your payment method. Click Open trade.",
              },
              {
                step: "2",
                title: "Receive bank details in chat",
                body: "A P2PxBT operator will send the recipient bank details - including account name, account number, sort code / routing number / IBAN and payment reference - directly into your trade chat. Do not use details from any other source.",
              },
              {
                step: "3",
                title: "Log in to your bank",
                body: "Use online banking, your bank's mobile app, or visit a branch to initiate a wire transfer. Select the correct payment rail for the destination (e.g. Faster Payments for a UK recipient).",
              },
              {
                step: "4",
                title: "Enter details exactly",
                body: "Copy the account details from the trade chat character-by-character. The payment reference (e.g. P2PXBT-1234) is critical - it is how the operator matches your payment to your trade. Do not omit it.",
              },
              {
                step: "5",
                title: "Send the exact amount",
                body: "Send the exact total shown on your trade page. Partial payments cannot be matched automatically. If you accidentally send the wrong amount, raise a dispute immediately.",
              },
              {
                step: "6",
                title: "Download your receipt",
                body: "Once your bank confirms the transfer, download or screenshot the payment confirmation. It should show the date, amount, your account details and the recipient's account details.",
              },
              {
                step: "7",
                title: "Upload receipt and mark as sent",
                body: "Open your trade, go to the Documents tab, upload your receipt, then click Mark payment as sent. The operator will verify your receipt against the payment reference and confirm the trade.",
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-sm font-bold text-primary">
                  {item.step}
                </span>
                <div>
                  <p className="font-semibold text-foreground text-sm mb-1">{item.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* What makes a good receipt */}
        <section className="mb-10">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
            What your receipt must show
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Date and time of the transfer",
              "Amount sent and currency",
              "Your name and account number (sender)",
              "Recipient account name and number",
              "Payment reference (P2PXBT-XXXX)",
              "Bank confirmation or transaction ID",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Acceptable formats: PNG, JPEG, WebP, HEIC or PDF. Maximum file size: 5 MB. Do not
            crop out the bank name, account numbers or reference - receipts missing these will
            delay confirmation.
          </p>
        </section>

        {/* Timing */}
        <section className="mb-10">
          <div className="flex gap-3 rounded-lg border border-border bg-muted/40 p-4">
            <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-semibold text-foreground mb-1">Remember the 4-hour window</p>
              <p className="text-muted-foreground">
                Every P2PxBT trade has a <strong>4-hour payment window</strong> from the moment it
                opens. You must send your wire, upload your receipt and click "Mark as sent" before
                the timer expires. If you are close to the deadline and your bank's wire has not
                landed yet, upload your proof of payment immediately - the operator can see it and
                hold the trade open while the funds arrive.
              </p>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="mb-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">Common mistakes to avoid</h2>
          <ul className="space-y-3">
            {[
              { bad: "Sending from a joint or business account", fix: "Use the same personal account in your verified name. Payments from third-party accounts are rejected." },
              { bad: "Omitting the payment reference", fix: "Always include the reference exactly as shown in chat (e.g. P2PXBT-8300). Without it the operator cannot match your payment." },
              { bad: "Sending slightly less to cover your bank's fee", fix: "Send the full trade amount. Your bank should deduct fees separately, not from the transfer amount. Check your bank's fee deduction method." },
              { bad: "Using a third-party payment app", fix: "Wire only. Apps like Wise, Revolut or PayPal are not accepted regardless of the underlying payment method." },
              { bad: "Uploading an edited or partial screenshot", fix: "Submit the unedited confirmation from your bank. Cropped or altered receipts will be declined." },
            ].map((item) => (
              <li key={item.bad} className="rounded-lg border border-border p-4 text-sm">
                <div className="flex items-start gap-2 mb-1">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  <span className="font-medium text-foreground">{item.bad}</span>
                </div>
                <div className="flex items-start gap-2 pl-6">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  <span className="text-muted-foreground">{item.fix}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="mb-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/marketplace">Open a Trade <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/faq">Read the FAQ</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/how-it-works">How It Works</Link>
          </Button>
        </section>

        {/* Related */}
        <section className="rounded-lg border border-border bg-muted/40 p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">Related guides</h3>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {[
              { label: "What is Bitcoin?", href: "/what-is-bitcoin" },
              { label: "What is USDT?", href: "/what-is-usdt" },
              { label: "How P2P trading works", href: "/how-it-works" },
              { label: "Live crypto prices", href: "/crypto-prices" },
              { label: "Buy Bitcoin in USA", href: "/buy-bitcoin-usa" },
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
