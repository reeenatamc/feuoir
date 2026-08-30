import { TransitionLink } from '../lib/navigation';
import { useTranslation } from 'react-i18next';
import { fireGradient } from '../theme/color';

export function CustomSection() {
  const { t } = useTranslation();

  return (
    <section className="min-h-screen flex items-center justify-center px-6 md:px-8">
      <div className="max-w-xl text-center space-y-8">
        <div
          className="w-12 h-[3px] mx-auto"
          style={{ background: fireGradient([['orange'], ['red']]) }}
        />
        <h2 className="text-3xl md:text-5xl tracking-tight">{t('custom.title')}</h2>
        <p className="text-base md:text-lg tracking-wide text-ink/55 leading-relaxed">{t('custom.description')}</p>
        <TransitionLink
          to="/shop"
          className="inline-block w-full sm:w-auto px-10 py-4 bg-ink text-ink-inverse text-xs tracking-[0.3em] uppercase hover:bg-ink/80 active:bg-ink/70 transition-colors"
        >
          {t('custom.cta')}
        </TransitionLink>
      </div>
    </section>
  );
}
