import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router';
import type { Session } from '@supabase/supabase-js';
import { supabase, settingsFromDb, logSupabaseError } from './lib/supabase';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { ProductGrid } from './components/ProductGrid';
import { Customizer } from './components/Customizer';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CartSection } from './components/CartSection';
import { AboutSection } from './components/AboutSection';
import { Archive } from './components/Archive';
import { Objects } from './components/Objects';
import { Commissions } from './components/Commissions';
import { ObjectDetail } from './components/ObjectDetail';
import { CustomSection } from './components/CustomSection';
import { CartProvider } from './lib/CartProvider';
import type { Product, Settings } from './types';

const defaultSettings: Settings = {
  whatsapp: '',
  shippingCost: 10,
  currency: 'USD',
  businessName: 'Feuoir',
  taxRate: 0,
};

/**
 * Rutas cuyo contenido arranca pegado al borde superior de la pantalla: la nav
 * flota encima en vez de empujarlas.
 *
 * El hero es una foto a sangre de alto completo. Con el desplazamiento que
 * aplica <main> para el resto de las paginas, arrancaba por debajo de la nav y
 * arriba quedaba a la vista una franja del fondo del contenedor: en modo claro
 * pasaba desapercibida, en modo oscuro se leia como una barra negra.
 */
const FULL_BLEED_ROUTES = new Set(['/']);

export default function App() {
  const [session, setSession]         = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [settings, setSettings]       = useState<Settings>(defaultSettings);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    // Evita setState despues de que el componente se desmonte
    let active = true;

    // Restore existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!active) return;
      logSupabaseError('auth.getSession', error);
      setSession(session);
      setAuthLoading(false);
    });

    // Keep session in sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!active) return;
      setSession(session);
    });

    // Fetch public settings (needed for WhatsApp checkout).
    // `maybeSingle` en vez de `single`: con 0 filas devuelve null en vez de tirar error.
    supabase.from('settings').select('*').maybeSingle().then(({ data, error }) => {
      if (!active) return;
      if (logSupabaseError('settings.select', error)) return;
      if (data) setSettings(settingsFromDb(data as Record<string, unknown>));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const handleLogout = () => supabase.auth.signOut();

  const isAuthenticated = !!session;
  const isFullBleed = FULL_BLEED_ROUTES.has(useLocation().pathname);

  return (
    // La bolsa envuelve tambien a la barra: el contador y la pagina de la bolsa
    // son la misma bolsa, y con un proveedor por vista volverian a discrepar.
    <CartProvider>
    <div className="min-h-screen bg-surface">
      <Navigation />

      <main className={isFullBleed ? undefined : 'pt-16 md:pt-20'}>
        <Routes>
          <Route path="/" element={<Hero />} />

          {/* Vocabulario de la casa. Las rutas anteriores siguen resolviendo a lo
              mismo: enlaces compartidos y marcadores no se rompen por un cambio
              de nombre. */}
          <Route path="/objects"          element={<Objects />} />
          <Route path="/objects/:number"  element={<ObjectDetail />} />
          {/* Legado: la retícula contra Supabase que habia antes en /objects.
              Se conserva alcanzable porque sigue siendo la unica vista del
              catalogo que administra el panel. Se retira cuando el backend
              propio pase a alimentar las piezas. */}
          <Route path="/shop"             element={<ProductGrid onSelect={setSelectedProduct} />} />
          <Route path="/commissions"      element={<Commissions settings={settings} />} />
          {/* Legado: la invitacion a personalizar que habia antes en
              /commissions. Se conserva alcanzable, fuera del menu. */}
          <Route path="/custom"           element={<CustomSection />} />
          <Route path="/bag"         element={<CartSection settings={settings} />} />
          <Route path="/cart"        element={<CartSection settings={settings} />} />
          <Route path="/about"       element={<AboutSection />} />

          <Route path="/archive" element={<Archive />} />

          <Route path="/admin/login" element={<AdminLogin isAuthenticated={isAuthenticated} />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} authLoading={authLoading}>
                <AdminPanel
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
        <Customizer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
    </CartProvider>
  );
}
