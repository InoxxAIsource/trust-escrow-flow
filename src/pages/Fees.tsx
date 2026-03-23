import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOHead from "@/components/SEOHead";

const fees = [
  { coin: "USDT", maker: "0.1%", taker: "0.1%", min: "$0.10", withdrawal: "1 USDT" },
  { coin: "BTC", maker: "0.1%", taker: "0.15%", min: "$0.50", withdrawal: "0.0001 BTC" },
  { coin: "ETH", maker: "0.1%", taker: "0.15%", min: "$0.50", withdrawal: "0.001 ETH" },
  { coin: "SOL", maker: "0.1%", taker: "0.15%", min: "$0.25", withdrawal: "0.01 SOL" },
];

const benefits = [
  "No hidden fees — what you see is what you pay",
  "Zero deposit fees for all cryptocurrencies",
  "Volume-based discounts for active traders",
  "Escrow protection included at no extra cost",
  "Free dispute resolution",
  "No monthly subscription or platform fees",
];

const Fees = () => (
  <>
    <SEOHead title="TrustP2P Fees — Transparent & Low Cost Trading" description="See TrustP2P's simple and transparent fee structure. Low trading fees, zero deposit fees, and free escrow protection." />

    <div className="container py-12">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Fees", href: "/fees" }]} />

      <div className="text-center mb-12">
        <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground">Simple, Transparent Fees</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          No hidden costs. Low fees. Escrow protection is always included for free.
        </p>
      </div>

      {/* Fee Table */}
      <Card className="max-w-3xl mx-auto mb-12">
        <CardHeader>
          <CardTitle className="font-display">Trading Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coin</TableHead>
                <TableHead>Maker Fee</TableHead>
                <TableHead>Taker Fee</TableHead>
                <TableHead>Min Fee</TableHead>
                <TableHead>Withdrawal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee) => (
                <TableRow key={fee.coin}>
                  <TableCell className="font-medium">{fee.coin}</TableCell>
                  <TableCell>{fee.maker}</TableCell>
                  <TableCell>{fee.taker}</TableCell>
                  <TableCell>{fee.min}</TableCell>
                  <TableCell>{fee.withdrawal}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Benefits */}
      <div className="max-w-2xl mx-auto">
        <h2 className="font-display text-2xl font-bold text-foreground text-center mb-6">Why Traders Choose TrustP2P</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {benefits.map((b) => (
            <div key={b} className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{b}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-12">
        <Button size="lg" asChild>
          <Link to="/marketplace">Start Trading</Link>
        </Button>
      </div>
    </div>
  </>
);

export default Fees;
