import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router';
import type { Session } from '@supabase/supabase-js';
import { supabase, settingsFromDb } from './lib/supabase';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { ProductGrid } from './components/ProductGrid';
import { Customizer } from './components/Customizer';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CartSection } from './components/CartSection';
import { AboutSection } from './components/AboutSection';
import { CustomSection } from './components/CustomSection';
import type { Product, CartItem, Settings } from './types';

const defaultSettings: Settings = {
  whatsapp: '',
  shippingCost: 10,
  currency: 'USD',
  businessName: 'Feuoir',
  taxRate: 0,
};

export default function App() {
  const [session, setSession]         = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart]               = useState<CartItem[]>([]);
  const [settings, setSettings]       = useState<Settings>(defaultSettings);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    // Restore existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Keep session in sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });

    // Fetch public settings (needed for WhatsApp checkout)
    supabase.from('settings').select('*').single().then(({ data }) => {
      if (data) setSettings(settingsFromDb(data as Record<string, unknown>));
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const handleAddToCart = (product: Product) => {
    setCart((prev) => [...prev, { product }]);
  };

  const handleLogout = () => supabase.auth.signOut();

  const isAuthenticated = !!session;

  return (
    <div className="min-h-screen bg-white">
      <Navigation cartCount={cart.length} />

      <main className="pt-16 md:pt-20">
        <Routes>
          <Route path="/"       element={<Hero />} />
          <Route path="/shop"   element={<ProductGrid onSelect={setSelectedProduct} />} />
          <Route path="/custom" element={<CustomSection />} />
          <Route path="/about"  element={<AboutSection />} />
          <Route path="/cart"   element={<CartSection cart={cart} settings={settings} />} />

          <Route path="/admin/login" element={<AdminLogin isAuthenticated={isAuthenticated} />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} authLoading={authLoading}>
                <AdminPanel
                  orders={cart}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onLogout={handleLogout}
                />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {selectedProduct && (
        <Customizer
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}
