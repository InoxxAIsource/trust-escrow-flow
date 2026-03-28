import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import Layout from "@/components/layout/Layout";
import Index from "./pages/Index";
import HowItWorks from "./pages/HowItWorks";
import Fees from "./pages/Fees";
import Marketplace from "./pages/Marketplace";
import Dashboard from "./pages/Dashboard";
import TradePage from "./pages/TradePage";
import Auth from "./pages/Auth";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import SEOLanding from "./pages/SEOLanding";
import OfferDetail from "./pages/OfferDetail";
import UserProfile from "./pages/UserProfile";
import Verify from "./pages/Verify";
import NotFound from "./pages/NotFound";
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
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/trade/:id" element={<TradePage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/offer/:id" element={<OfferDetail />} />
                <Route path="/user/:username" element={<UserProfile />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/admin/risk" element={<AdminRisk />} />
                {seoSlugs.map((slug) => (
                  <Route key={slug} path={`/${slug}`} element={<SEOLanding />} />
                ))}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
