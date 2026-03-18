import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/hooks/useLanguage";
import { CartProvider } from "@/hooks/useCart";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { EditModeProvider } from "@/hooks/useEditMode";
import { SiteContentProvider } from "@/hooks/useSiteContent";
import { SystemSettingsProvider } from "@/hooks/useSystemSettings";
import { ThemeLoader } from "@/components/ThemeLoader";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

import { EditModeToggle } from "@/components/EditModeToggle";
import { EditorPanel } from "@/components/editor/EditorPanel";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import ProductDetails from "./pages/ProductDetails";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminAuth from "./pages/admin/Auth";
import Dashboard from "./pages/admin/Dashboard";
import Orders from "./pages/admin/Orders";
import Categories from "./pages/admin/Categories";
import ProductsNew from "./pages/admin/ProductsNew";
import Customers from "./pages/admin/Customers";
import SiteContent from "./pages/admin/SiteContent";
import Admins from "./pages/admin/Admins";
import Settings from "./pages/admin/Settings";
import SystemSettings from "./pages/admin/SystemSettings";
import Themes from "./pages/admin/Themes";
import CheckoutFormSettings from "./pages/admin/CheckoutFormSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ThemeLoader>
        <SystemSettingsProvider>
          <LanguageProvider>
            <CartProvider>
              <AuthProvider>
                <SiteContentProvider>
                  <EditModeProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <ScrollToTop />
                      <Routes>
                        {/* Admin Auth */}
                        <Route path="/admin/auth" element={<AdminAuth />} />
                        
                        {/* Admin Routes */}
                        <Route path="/admin" element={<AdminLayout />}>
                          <Route index element={
                            <ProtectedRoute module="dashboard">
                              <Dashboard />
                            </ProtectedRoute>
                          } />
                          <Route path="orders" element={
                            <ProtectedRoute module="orders">
                              <Orders />
                            </ProtectedRoute>
                          } />
                          <Route path="categories" element={
                            <ProtectedRoute module="categories">
                              <Categories />
                            </ProtectedRoute>
                          } />
                          <Route path="products" element={
                            <ProtectedRoute module="products">
                              <ProductsNew />
                            </ProtectedRoute>
                          } />
                          <Route path="customers" element={
                            <ProtectedRoute module="customers">
                              <Customers />
                            </ProtectedRoute>
                          } />
                          <Route path="content" element={
                            <ProtectedRoute module="siteContent">
                              <SiteContent />
                            </ProtectedRoute>
                          } />
                          <Route path="admins" element={
                            <ProtectedRoute module="admins">
                              <Admins />
                            </ProtectedRoute>
                          } />
                          <Route path="themes" element={
                            <ProtectedRoute module="themes">
                              <Themes />
                            </ProtectedRoute>
                          } />
                          <Route path="settings" element={
                            <ProtectedRoute module="telegram">
                              <Settings />
                            </ProtectedRoute>
                          } />
                          <Route path="checkout-form" element={
                            <ProtectedRoute module="siteContent">
                              <CheckoutFormSettings />
                            </ProtectedRoute>
                          } />
                          <Route path="system" element={
                            <ProtectedRoute module="systemSettings">
                              <SystemSettings />
                            </ProtectedRoute>
                          } />
                        </Route>
                      
                      {/* Public Routes */}
                      <Route path="*" element={
                        <div className="flex flex-col min-h-screen">
                          <Header />
                          <main className="flex-1">
                            <Routes>
                              <Route path="/" element={<Index />} />
                              <Route path="/catalog" element={<Catalog />} />
                              <Route path="/product/:id" element={<ProductDetails />} />
                              <Route path="/about" element={<About />} />
                              <Route path="/contact" element={<Contact />} />
                              <Route path="/faq" element={<FAQ />} />
                              <Route path="/cart" element={<Cart />} />
                              <Route path="/checkout" element={<Checkout />} />
                              <Route path="/thank-you" element={<ThankYou />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </main>
                          <Footer />
                          
                          <EditModeToggle />
                          <EditorPanel />
                        </div>
                        } />
                      </Routes>
                    </BrowserRouter>
                  </TooltipProvider>
                  </EditModeProvider>
                </SiteContentProvider>
              </AuthProvider>
            </CartProvider>
          </LanguageProvider>
        </SystemSettingsProvider>
      </ThemeLoader>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
