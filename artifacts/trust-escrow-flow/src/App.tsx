import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import Layout from "@/components/layout/Layout";
import Index from "./pages/Index";
import HowItWorks from "./pages/HowItWorks";
import Fees from "./pages/Fees";
import DemoMarketplace from "./pages/DemoMarketplace";
import Dashboard from "./pages/Dashboard";
import DemoTradePage from "./pages/DemoTradePage";
import AdminConsole from "./pages/admin/AdminConsole";
import AdminTradeDetail from "./pages/admin/AdminTradeDetail";
import Auth from "./pages/Auth";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import SEOLanding from "./pages/SEOLanding";
import OfferDetail from "./pages/OfferDetail";
import UserProfile from "./pages/UserProfile";
import Verify from "./pages/Verify";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import FAQ from "./pages/FAQ";
import WhatIsBitcoin from "./pages/WhatIsBitcoin";
import WhatIsUSDT from "./pages/WhatIsUSDT";
import WireTransferGuide from "./pages/WireTransferGuide";
import CryptoPrices from "./pages/CryptoPrices";
import AdminRisk from "./pages/AdminRisk";
import { getAllSlugs } from "./data/seo-pages";

const queryClient = new QueryClient();

const seoSlugs = getAllSlugs();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/fees" element={<Fees />} />
                <Route path="/marketplace" element={<DemoMarketplace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/trade/:id" element={<DemoTradePage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/offer/:id" element={<OfferDetail />} />
                <Route path="/user/:username" element={<UserProfile />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/what-is-bitcoin" element={<WhatIsBitcoin />} />
                <Route path="/what-is-usdt" element={<WhatIsUSDT />} />
                <Route path="/wire-transfer-guide" element={<WireTransferGuide />} />
                <Route path="/crypto-prices" element={<CryptoPrices />} />
                <Route path="/admin" element={<AdminConsole />} />
                <Route path="/admin/trade/:id" element={<AdminTradeDetail />} />
                <Route path="/admin/risk" element={<AdminRisk />} />
                {seoSlugs.map((slug) => (
                  <Route key={slug} path={`/${slug}`} element={<SEOLanding />} />
                ))}
                {/*
                  No dead ends: anything unmatched lands on the home page
                  rather than a 404. vercel.json 301s every URL the old site
                  served to its nearest surviving equivalent; this catches
                  everything else - typos, stale deep links, old app routes.
                */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
