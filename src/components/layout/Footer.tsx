import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const buyLinks = [
  { label: "Buy USDT", href: "/buy-usdt" },
  { label: "Buy Bitcoin", href: "/buy-bitcoin" },
  { label: "Buy Ethereum", href: "/buy-ethereum" },
  { label: "Buy Solana", href: "/buy-solana" },
];

const sellLinks = [
  { label: "Sell USDT", href: "/sell-usdt" },
  { label: "Sell Bitcoin", href: "/sell-bitcoin" },
  { label: "Sell Ethereum", href: "/sell-ethereum" },
  { label: "Sell Solana", href: "/sell-solana" },
];

const countryLinks = [
  { label: "India", href: "/buy-usdt-india" },
  { label: "USA", href: "/buy-usdt-usa" },
  { label: "UK", href: "/buy-usdt-uk" },
  { label: "UAE", href: "/buy-usdt-uae" },
  { label: "Nigeria", href: "/buy-usdt-nigeria" },
  { label: "Turkey", href: "/buy-usdt-turkey" },
  { label: "Philippines", href: "/buy-usdt-philippines" },
  { label: "Brazil", href: "/buy-usdt-brazil" },
];

const paymentLinks = [
  { label: "UPI", href: "/buy-usdt-upi" },
  { label: "Bank Transfer", href: "/buy-usdt-bank-transfer" },
  { label: "PayPal", href: "/buy-bitcoin-paypal" },
  { label: "Zelle", href: "/buy-usdt-zelle" },
  { label: "M-Pesa", href: "/buy-usdt-mpesa" },
  { label: "PIX", href: "/buy-usdt-pix" },
  { label: "GCash", href: "/buy-usdt-gcash" },
  { label: "Revolut", href: "/buy-usdt-revolut" },
];

const companyLinks = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Fees", href: "/fees" },
  { label: "Blog", href: "/blog" },
  { label: "Marketplace", href: "/marketplace" },
];

const comboLinks = [
  { label: "Buy USDT India UPI", href: "/buy-usdt-india-upi" },
  { label: "Buy BTC India UPI", href: "/buy-bitcoin-india-upi" },
  { label: "Buy USDT USA Zelle", href: "/buy-usdt-usa-zelle" },
  { label: "Buy BTC USA PayPal", href: "/buy-bitcoin-usa-paypal" },
  { label: "Buy USDT Nigeria", href: "/buy-usdt-nigeria" },
  { label: "Buy USDT Kenya M-Pesa", href: "/buy-usdt-kenya-mpesa" },
  { label: "Buy USDT Brazil PIX", href: "/buy-usdt-brazil-pix" },
  { label: "Buy USDT Philippines GCash", href: "/buy-usdt-philippines-gcash" },
];

const FooterSection = ({ title, links }: { title: string; links: { label: string; href: string }[] }) => (
  <div>
    <h3 className="font-display font-semibold text-foreground mb-3 text-sm">{title}</h3>
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.href}>
          <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => (
  <footer className="border-t bg-card mt-auto">
    <div className="container py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
        {/* Brand */}
        <div className="col-span-2">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground mb-3">
            <Shield className="h-5 w-5 text-primary" />
            TrustP2P
          </Link>
          <p className="text-sm text-muted-foreground mb-4">
            Trade crypto safely with escrow protection. Trusted by thousands of traders in 20+ countries.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>12,400+ trades</span>
            <span>•</span>
            <span>3,200+ traders</span>
          </div>
        </div>

        <FooterSection title="Buy Crypto" links={buyLinks} />
        <FooterSection title="Sell Crypto" links={sellLinks} />
        <FooterSection title="Countries" links={countryLinks} />
        <FooterSection title="Payments" links={paymentLinks} />
      </div>

      {/* Popular combos row */}
      <div className="mt-8 pt-6 border-t">
        <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Popular Searches</h3>
        <div className="flex flex-wrap gap-2">
          {comboLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors bg-secondary px-2.5 py-1 rounded-md"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Company row */}
      <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-4 text-sm text-muted-foreground">
          {companyLinks.map((link) => (
            <Link key={link.href} to={link.href} className="hover:text-foreground transition-colors">{link.label}</Link>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} TrustP2P. All rights reserved.
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
