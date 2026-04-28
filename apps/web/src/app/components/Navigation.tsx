import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Menu, X, ShoppingBag, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Navigation({ cartCount = 0 }: { cartCount?: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es');
  };

  const navAndClose = (to: string) => {
    navigate(to);
    setMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-16 md:h-20">

          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-70">
            <img
              src="/logo-flame.png"
              alt="Feuoir"
              style={{
                height: '34px',
                width: '22px',
                objectFit: 'cover',
                objectPosition: '50% 32%',
                mixBlendMode: 'multiply',
              }}
            />
            <span className="tracking-[0.3em] uppercase text-sm">feuoir</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10 lg:gap-12">
            <Link to="/shop"   className="text-sm tracking-wide transition-opacity hover:opacity-60">{t('nav.shop')}</Link>
            <Link to="/custom" className="text-sm tracking-wide transition-opacity hover:opacity-60">{t('nav.customize')}</Link>
            <Link to="/about"  className="text-sm tracking-wide transition-opacity hover:opacity-60">{t('nav.about')}</Link>
            <Link
              to="/cart"
              className="px-5 py-2 bg-black text-white text-sm transition-all hover:bg-black/80"
            >
              {cartCount > 0 ? t('nav.cartCount', { count: cartCount }) : t('nav.cart')}
            </Link>

            {/* Language switcher */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 text-[10px] tracking-[0.25em] uppercase text-black/30 hover:text-black/60 transition-colors"
            >
              <Globe size={11} />
              {i18n.language === 'es' ? 'EN' : 'ES'}
            </button>

            <Link
              to="/admin"
              className="text-[10px] tracking-[0.3em] uppercase text-black/20 hover:text-black/45 transition-colors"
            >
              {t('nav.admin')}
            </Link>
          </div>

          {/* Mobile controls */}
          <div className="flex md:hidden items-center gap-1">
            <Link
              to="/cart"
              className="relative w-11 h-11 flex items-center justify-center transition-opacity hover:opacity-60"
              aria-label={t('nav.cart')}
            >
              <ShoppingBag size={19} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute top-2 right-2 w-[15px] h-[15px] bg-black text-white text-[8px] font-medium rounded-full flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-11 h-11 flex items-center justify-center transition-opacity hover:opacity-60"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {menuOpen ? <X size={19} strokeWidth={1.5} /> : <Menu size={19} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white/97 backdrop-blur-md border-t border-black/5">
          <div className="max-w-7xl mx-auto px-6 pb-3">
            {[
              { label: t('nav.shop'),      to: '/shop' },
              { label: t('nav.customize'), to: '/custom' },
              { label: t('nav.about'),     to: '/about' },
            ].map(({ label, to }) => (
              <button
                key={to}
                onClick={() => navAndClose(to)}
                className="w-full text-left py-4 text-sm tracking-wide border-b border-black/5 last:border-0 transition-opacity hover:opacity-60 active:opacity-40"
              >
                {label}
              </button>
            ))}

            {/* Language switcher mobile */}
            <button
              onClick={toggleLang}
              className="w-full text-left py-4 flex items-center gap-2 text-xs tracking-widest uppercase text-black/35 border-b border-black/5 transition-opacity hover:opacity-60"
            >
              <Globe size={12} />
              {i18n.language === 'es' ? 'English' : 'Español'}
            </button>

            <button
              onClick={() => navAndClose('/admin')}
              className="w-full text-left py-4 text-[10px] tracking-[0.3em] uppercase text-black/25 transition-opacity hover:opacity-60"
            >
              {t('nav.admin')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
