import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

interface FAQCategory {
  category: string;
  items: FAQItem[];
}

const faqs: FAQCategory[] = [
  {
    category: "About P2PxBT",
    items: [
      {
        question: "What is P2PxBT?",
        answer: (
          <>
            P2PxBT is a peer-to-peer cryptocurrency trading platform that connects buyers and
            sellers directly. Trades are settled via local payment rails — bank wire, UK Faster
            Payments, and more — without an intermediary holding funds.{" "}
            <Link to="/how-it-works" className="text-primary underline underline-offset-2">
              See how it works →
            </Link>
          </>
        ),
      },
      {
        question: "Which cryptocurrencies can I trade?",
        answer: (
          <>
            P2PxBT supports Bitcoin (BTC), Ethereum (ETH), Solana (SOL) and Tether (USDT). The
            marketplace lists counterparties for each asset across our four markets: United
            States, United Kingdom, Europe and Hong Kong.
          </>
        ),
      },
      {
        question: "Which countries and payment methods are supported?",
        answer: (
          <>
            We currently serve traders in the <strong>United States</strong>,{" "}
            <strong>United Kingdom</strong>, <strong>Europe</strong> and{" "}
            <strong>Hong Kong</strong>. Accepted payment methods include Bank Wire, UK Faster
            Payments, SEPA, and other local rails listed by each counterparty.
          </>
        ),
      },
      {
        question: "Is P2PxBT a regulated exchange?",
        answer: (
          <>
            P2PxBT is a peer-to-peer marketplace, not a centralised exchange. We do not hold
            customer funds, operate an order book, or act as a counterparty to any trade. Always
            review our{" "}
            <Link to="/terms" className="text-primary underline underline-offset-2">
              Terms of Service
            </Link>{" "}
            before trading.
          </>
        ),
      },
    ],
  },
  {
    category: "Getting Started",
    items: [
      {
        question: "How do I open my first trade?",
        answer: (
          <ol className="list-decimal space-y-1.5 pl-4 text-sm">
            <li>
              <Link to="/auth?tab=signup" className="text-primary underline underline-offset-2">
                Create an account
              </Link>{" "}
              with your email address.
            </li>
            <li>
              Complete{" "}
              <Link to="/verify" className="text-primary underline underline-offset-2">
                identity verification
              </Link>{" "}
              — required before your first trade.
            </li>
            <li>
              Browse the{" "}
              <Link to="/marketplace" className="text-primary underline underline-offset-2">
                marketplace
              </Link>
              , pick a counterparty, enter an amount and choose a payment method.
            </li>
            <li>
              Click <strong>Open trade</strong>. Payment details arrive in the trade chat from a
              P2PxBT operator.
            </li>
            <li>Send payment, upload your receipt, and mark it as sent. The operator confirms and releases the crypto.</li>
          </ol>
        ),
      },
      {
        question: "What is the 4-hour payment window?",
        answer: (
          <>
            Every trade has a <strong>4-hour window</strong> from the moment it opens. You must
            complete your payment and upload your receipt within that window. If the window
            elapses without a confirmed payment the trade expires automatically and you will need
            to open a new one. The countdown is shown in real time on your trade page.
          </>
        ),
      },
      {
        question: "Why is identity verification required?",
        answer: (
          <>
            Verification helps protect buyers, sellers and the platform from fraud and misuse. An
            operator reviews your submitted document before your first trade is allowed to proceed.
            See the{" "}
            <Link to="/verify" className="text-primary underline underline-offset-2">
              verification page
            </Link>{" "}
            to start.
          </>
        ),
      },
    ],
  },
  {
    category: "Trading & Payments",
    items: [
      {
        question: "How are payment details shared?",
        answer: (
          <>
            After your trade opens, a P2PxBT operator sends the counterparty's payment details
            directly into the trade chat — they are never displayed in advance. Only send payment
            to details delivered inside the secure trade chat.
          </>
        ),
      },
      {
        question: "Can I send payment through a third-party service or online transfer?",
        answer: (
          <>
            No. Payment must be made via <strong>physical wire transfer only</strong>. Do not use
            third-party payment apps or online-only transfers. Once payment is sent, upload your
            receipt in the Documents tab of your trade. See our full{" "}
            <Link to="/wire-transfer-guide" className="text-primary underline underline-offset-2">
              wire transfer guide
            </Link>
            .
          </>
        ),
      },
      {
        question: "What happens after I mark payment as sent?",
        answer: (
          <>
            The operator verifies your receipt against the payment reference. Once confirmed, they
            mark the trade as complete and the asset is credited to your P2PxBT wallet. You can
            check the status at any time on your{" "}
            <Link to="/dashboard" className="text-primary underline underline-offset-2">
              dashboard
            </Link>
            .
          </>
        ),
      },
      {
        question: "What if there is a problem with my trade?",
        answer: (
          <>
            Use the <strong>Raise dispute</strong> button on your trade page. An operator will
            review the trade and respond in the chat. Never send additional payment while a
            dispute is open.
          </>
        ),
      },
      {
        question: "Can I cancel a trade?",
        answer: (
          <>
            Yes — you can cancel at any point before you mark payment as sent, using the{" "}
            <strong>Cancel trade</strong> button on your trade page. Once payment has been marked,
            cancellation requires a dispute to be raised.
          </>
        ),
      },
    ],
  },
  {
    category: "Fees & Pricing",
    items: [
      {
        question: "What are the trading fees?",
        answer: (
          <>
            Full fee details are on the{" "}
            <Link to="/fees" className="text-primary underline underline-offset-2">
              Fees page
            </Link>
            . Counterparty premiums vary and are displayed as a percentage above market price on
            each offer card in the marketplace.
          </>
        ),
      },
      {
        question: "Where do cryptocurrency prices come from?",
        answer: (
          <>
            Reference prices are sourced from an aggregate market data feed and refreshed every
            30 seconds. Prices may be delayed or differ from other sources. Nothing shown is
            financial advice. See our{" "}
            <Link to="/crypto-prices" className="text-primary underline underline-offset-2">
              live crypto prices page
            </Link>{" "}
            for the latest BTC, ETH, SOL and USDT rates.
          </>
        ),
      },
    ],
  },
  {
    category: "Security & Privacy",
    items: [
      {
        question: "How is my data protected?",
        answer: (
          <>
            Account data and trade records are stored securely. For full details see our{" "}
            <Link to="/privacy" className="text-primary underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </>
        ),
      },
      {
        question: "How do I report a security issue?",
        answer: (
          <>
            Email{" "}
            <a
              href="mailto:security@p2pxbt.com"
              className="text-primary underline underline-offset-2"
            >
              security@p2pxbt.com
            </a>{" "}
            with a description of the issue. We aim to acknowledge all reports within 24 hours.
          </>
        ),
      },
    ],
  },
  {
    category: "Account",
    items: [
      {
        question: "How do I close my account?",
        answer: (
          <>
            Email{" "}
            <a
              href="mailto:support@p2pxbt.com"
              className="text-primary underline underline-offset-2"
            >
              support@p2pxbt.com
            </a>{" "}
            from your registered address and we will delete your account and associated data. See
            our{" "}
            <Link to="/terms" className="text-primary underline underline-offset-2">
              Terms of Service
            </Link>{" "}
            for more.
          </>
        ),
      },
      {
        question: "I forgot my password — what do I do?",
        answer: (
          <>
            Use the <strong>Forgot password</strong> link on the{" "}
            <Link to="/auth" className="text-primary underline underline-offset-2">
              sign-in page
            </Link>
            . A reset link will be sent to your registered email address.
          </>
        ),
      },
    ],
  },
];

const usefulLinks = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Fees", href: "/fees" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Start verification", href: "/verify" },
  { label: "Live Crypto Prices", href: "/crypto-prices" },
  { label: "What is Bitcoin?", href: "/what-is-bitcoin" },
  { label: "What is USDT?", href: "/what-is-usdt" },
  { label: "Wire Transfer Guide", href: "/wire-transfer-guide" },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="flex w-full items-start justify-between gap-4 py-4 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-foreground">{item.question}</span>
        {open ? (
          <ChevronUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
        )}
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-[600px] pb-4 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="text-sm leading-relaxed text-muted-foreground">{item.answer}</div>
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="container py-12 lg:py-16">
      <SEOHead
        title="FAQ — P2PxBT"
        description="Answers to common questions about P2PxBT: how trading works, payment methods, fees, identity verification, and account management."
        canonical="https://p2pxbt.com/faq"
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ", href: "/faq" }]} />

      <div className="mx-auto max-w-[70ch]">
        <header className="border-b border-border pb-6">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Frequently asked questions
          </h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Can't find what you're looking for? Email us at{" "}
            <a href="mailto:support@p2pxbt.com" className="text-primary underline underline-offset-2">
              support@p2pxbt.com
            </a>{" "}
            or visit the{" "}
            <Link to="/how-it-works" className="text-primary underline underline-offset-2">
              How It Works
            </Link>{" "}
            page.
          </p>
        </header>

        <div className="mt-10 space-y-10">
          {faqs.map((cat) => (
            <section key={cat.category}>
              <h2 className="mb-2 font-display text-base font-semibold text-foreground">
                {cat.category}
              </h2>
              <div className="rounded-lg border border-border bg-card px-4">
                {cat.items.map((item) => (
                  <FAQAccordion key={item.question} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Useful links */}
        <div className="mt-12 rounded-lg border border-border bg-muted/40 p-5">
          <h3 className="mb-3 font-display text-sm font-semibold text-foreground">Useful links</h3>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {usefulLinks.map((l) => (
              <li key={l.href}>
                <Link
                  to={l.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
