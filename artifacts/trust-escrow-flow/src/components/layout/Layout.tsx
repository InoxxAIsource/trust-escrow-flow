import Header from "./Header";
import Footer from "./Footer";
import { MarketTicker } from "./MarketTicker";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col">
    <MarketTicker />
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default Layout;
