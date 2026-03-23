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
];

const paymentLinks = [
  { label: "UPI", href: "/buy-usdt-upi" },
  { label: "Bank Transfer", href: "/buy-usdt-bank-transfer" },
  { label: "PayPal", href: "/buy-bitcoin-paypal" },
];

const companyLinks = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Fees", href: "/fees" },
  { label: "Blog", href: "/blog" },
  { label: "Marketplace", href: "/marketplace" },
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground mb-3">
            <Shield className="h-5 w-5 text-primary" />
            TrustP2P
          </Link>
          <p className="text-sm text-muted-foreground">
            Trade crypto safely with escrow protection. Trusted by thousands of traders worldwide.
          </p>
        </div>

        <FooterSection title="Buy Crypto" links={buyLinks} />
        <FooterSection title="Sell Crypto" links={sellLinks} />
        <FooterSection title="Countries" links={countryLinks} />
        <FooterSection title="Company" links={companyLinks} />
      </div>

      <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
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
