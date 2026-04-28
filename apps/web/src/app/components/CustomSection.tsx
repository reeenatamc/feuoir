import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

export function CustomSection() {
  const { t } = useTranslation();

  return (
    <section className="min-h-screen flex items-center justify-center px-6 md:px-8">
      <div className="max-w-xl text-center space-y-8">
        <div
          className="w-12 h-[3px] mx-auto"
          style={{ background: 'linear-gradient(90deg, #FF5A1F 0%, #C1121F 100%)' }}
        />
        <h2 className="text-3xl md:text-5xl tracking-tight">{t('custom.title')}</h2>
        <p className="text-base md:text-lg tracking-wide text-black/55 leading-relaxed">{t('custom.description')}</p>
        <Link
          to="/shop"
          className="inline-block w-full sm:w-auto px-10 py-4 bg-black text-white text-xs tracking-[0.3em] uppercase hover:bg-black/80 active:bg-black/70 transition-colors"
        >
          {t('custom.cta')}
        </Link>
      </div>
    </section>
  );
}
