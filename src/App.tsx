import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SiteLayout } from "@/components/layout/SiteLayout";
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Affiliate from "./pages/Affiliate";
import Blog from "./pages/Blog";
import Changelog from "./pages/Changelog";
import DemoGallery from "./pages/DemoGallery";
import FAQ from "./pages/FAQ";
import Guide from "./pages/Guide";
import LicenseTerms from "./pages/LicenseTerms";
import Reviews from "./pages/Reviews";
import SystemStatus from "./pages/SystemStatus";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/guide" element={<Guide />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/license" element={<LicenseTerms />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/changelog" element={<Changelog />} />
              <Route path="/demo-gallery" element={<DemoGallery />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/status" element={<SystemStatus />} />
              <Route path="/affiliate" element={<Affiliate />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
