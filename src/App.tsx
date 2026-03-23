import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/Layout";
import Index from "./pages/Index";
import HowItWorks from "./pages/HowItWorks";
import Fees from "./pages/Fees";
import Marketplace from "./pages/Marketplace";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import SEOLanding from "./pages/SEOLanding";
import OfferDetail from "./pages/OfferDetail";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// All SEO page slugs
const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/fees" element={<Fees />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/offer/:id" element={<OfferDetail />} />
              <Route path="/user/:username" element={<UserProfile />} />
              <Route path="/buy-usdt" element={<SEOLanding />} />
              <Route path="/sell-usdt" element={<SEOLanding />} />
              <Route path="/buy-bitcoin" element={<SEOLanding />} />
              <Route path="/sell-bitcoin" element={<SEOLanding />} />
              <Route path="/buy-ethereum" element={<SEOLanding />} />
              <Route path="/sell-ethereum" element={<SEOLanding />} />
              <Route path="/buy-solana" element={<SEOLanding />} />
              <Route path="/sell-solana" element={<SEOLanding />} />
              <Route path="/buy-usdt-india" element={<SEOLanding />} />
              <Route path="/buy-usdt-usa" element={<SEOLanding />} />
              <Route path="/buy-bitcoin-india" element={<SEOLanding />} />
              <Route path="/buy-usdt-upi" element={<SEOLanding />} />
              <Route path="/buy-usdt-bank-transfer" element={<SEOLanding />} />
              <Route path="/buy-bitcoin-paypal" element={<SEOLanding />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
