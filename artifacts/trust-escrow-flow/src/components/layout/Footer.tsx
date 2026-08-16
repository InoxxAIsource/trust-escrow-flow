import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

// Markets the platform actually covers: US, UK, Europe, Hong Kong.
const topSEOLinks = [
  { label: "Buy USDT", href: "/buy-usdt" },
  { label: "Buy Bitcoin", href: "/buy-bitcoin" },
  { label: "Buy USDT in USA", href: "/buy-usdt-usa" },
  { label: "Buy USDT in UK", href: "/buy-usdt-uk" },
  { label: "Buy Bitcoin in USA", href: "/buy-bitcoin-usa" },
  { label: "Buy Bitcoin in UK", href: "/buy-bitcoin-uk" },
  { label: "Sell USDT", href: "/sell-usdt" },
  { label: "Sell Bitcoin", href: "/sell-bitcoin" },
  { label: "Buy Ethereum", href: "/buy-ethereum" },
  { label: "Buy Solana", href: "/buy-solana" },
];

const companyLinks = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Fees", href: "/fees" },
  { label: "Blog", href: "/blog" },
  { label: "Marketplace", href: "/marketplace" },
];

const Footer = () => (
  <footer className="border-t bg-card mt-auto">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground mb-3">
            <Shield className="h-5 w-5 text-primary" />
            P2PxBT
          </Link>
          <p className="text-sm text-muted-foreground mb-4">
            Peer-to-peer trading in BTC, ETH, SOL and USDT across four markets, on local payment
            rails.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>126 counterparties</span>
            <span>•</span>
            <span>4 markets</span>
          </div>
        </div>

        {/* Top SEO Pages */}
        <div>
          <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Popular</h3>
          <ul className="grid grid-cols-2 gap-2">
            {topSEOLinks.map((link) => (
              <li key={link.href}>
                <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Company</h3>
          <ul className="space-y-2">
            {companyLinks.map((link) => (
              <li key={link.href}>
                <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/*
        The only standing disclosure left on the site. The banner across every
        page was removed, but this cannot be: counterparties on this platform
        are simulated and no funds move, and a visitor has no way to know that
        from the interface alone.
      */}
      <p className="mt-8 border-t pt-6 text-xs leading-relaxed text-muted-foreground">
        P2PxBT is a product demonstration. Counterparties are simulated, payment details are
        non-functional placeholders, and no crypto, fiat or bank transfer is processed. P2PxBT
        holds no customer funds and provides no custody, escrow or settlement service.
      </p>

      {/* Bottom */}
      <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} P2PxBT. All rights reserved.
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
