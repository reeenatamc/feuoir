import { useTranslation } from 'react-i18next';
import { fireGradient } from '../theme/color';

export function AboutSection() {
  const { t } = useTranslation();

  return (
    <section className="min-h-screen flex items-center justify-center px-6 md:px-8">
      <div className="max-w-3xl text-center space-y-6 md:space-y-8">
        <h2 className="text-3xl md:text-6xl tracking-tight">{t('about.title')}</h2>
        <p className="text-base md:text-xl tracking-wide text-ink/60 leading-relaxed">{t('about.description')}</p>
        <div
          className="w-32 h-1 mx-auto"
          style={{ background: fireGradient([['orange'], ['red'], ['yellow']]) }}
        />
      </div>
    </section>
  );
}
