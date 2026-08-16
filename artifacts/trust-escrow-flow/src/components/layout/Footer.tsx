import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const tradeLinks = [
  { label: "Buy Bitcoin (BTC)", href: "/buy-bitcoin" },
  { label: "Buy USDT", href: "/buy-usdt" },
  { label: "Buy Ethereum (ETH)", href: "/buy-ethereum" },
  { label: "Buy Solana (SOL)", href: "/buy-solana" },
  { label: "Sell Bitcoin (BTC)", href: "/sell-bitcoin" },
  { label: "Sell USDT", href: "/sell-usdt" },
  { label: "Buy Bitcoin in USA", href: "/buy-bitcoin-usa" },
  { label: "Buy Bitcoin in UK", href: "/buy-bitcoin-uk" },
  { label: "Buy USDT in USA", href: "/buy-usdt-usa" },
  { label: "Buy USDT in UK", href: "/buy-usdt-uk" },
];

const platformLinks = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Fees", href: "/fees" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Verify Identity", href: "/verify" },
];

const legalLinks = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

const learnLinks = [
  { label: "Live Crypto Prices", href: "/crypto-prices" },
  { label: "What is Bitcoin?", href: "/what-is-bitcoin" },
  { label: "What is USDT?", href: "/what-is-usdt" },
  { label: "Wire Transfer Guide", href: "/wire-transfer-guide" },
];

const Footer = () => (
  <footer className="border-t bg-card mt-auto">
    <div className="container py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground mb-3">
            <Shield className="h-5 w-5 text-primary" />
            P2PxBT
          </Link>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Peer-to-peer crypto trading across four markets — USA, UK, Europe and Hong Kong —
            settled on local payment rails.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>126 counterparties</span>
            <span>•</span>
            <span>4 markets</span>
            <span>•</span>
            <span>BTC · ETH · SOL · USDT</span>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Questions?{" "}
            <a href="mailto:support@p2pxbt.com" className="text-primary hover:underline">
              support@p2pxbt.com
            </a>
          </p>
        </div>

        {/* Trade */}
        <div>
          <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Trade</h3>
          <ul className="space-y-2">
            {tradeLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Platform */}
        <div>
          <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Platform</h3>
          <ul className="space-y-2">
            {platformLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Resources</h3>
          <ul className="space-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <h4 className="font-display font-semibold text-foreground mt-5 mb-3 text-sm">Learn</h4>
          <ul className="space-y-2">
            {learnLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} P2PxBT. All rights reserved.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
          <a href="mailto:support@p2pxbt.com" className="hover:text-foreground transition-colors">
            support@p2pxbt.com
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
