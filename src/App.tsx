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
import { getAllSlugs } from "./data/seo-pages";

const queryClient = new QueryClient();

// Generate routes for all SEO pages
const seoSlugs = getAllSlugs();

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
              {seoSlugs.map((slug) => (
                <Route key={slug} path={`/${slug}`} element={<SEOLanding />} />
              ))}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
