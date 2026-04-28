import { useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Hero() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const categories = [
    {
      key: 'gripTape',
      title: t('hero.gripTape'),
      desc: t('hero.gripTapeDesc'),
      gradient: 'linear-gradient(90deg, #FF5A1F 0%, #C1121F 100%)',
      border: 'border-b md:border-b-0 md:border-r border-black/5',
    },
    {
      key: 'lighters',
      title: t('hero.lighters'),
      desc: t('hero.lightersDesc'),
      gradient: 'linear-gradient(90deg, #C1121F 0%, #FFC300 100%)',
      border: 'border-b md:border-b-0 md:border-r border-black/5',
    },
    {
      key: 'apparel',
      title: t('hero.apparel'),
      desc: t('hero.apparelDesc'),
      gradient: 'linear-gradient(90deg, #FFC300 0%, #FF5A1F 100%)',
      border: '',
    },
  ];

  const steps = [
    { n: '01', title: t('hero.step1'), desc: t('hero.step1Desc') },
    { n: '02', title: t('hero.step2'), desc: t('hero.step2Desc') },
    { n: '03', title: t('hero.step3'), desc: t('hero.step3Desc') },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] flex items-center justify-center relative overflow-hidden bg-white">
        <div className="relative z-10 text-center max-w-4xl w-full px-6 md:px-8">
          <img
            src="/logo-flame.png"
            alt=""
            aria-hidden="true"
            className="mx-auto mb-4 md:mb-6 w-40 sm:w-52 md:w-64 pointer-events-none select-none"
            style={{ mixBlendMode: 'multiply', opacity: 0.9 }}
          />
          <h1 className="text-[2.25rem] sm:text-[4rem] md:text-[5.5rem] leading-[0.92] mb-4 md:mb-8 tracking-tight whitespace-pre-line">
            {t('hero.title')}
          </h1>
          <p className="text-base md:text-xl lg:text-2xl tracking-wide mb-8 md:mb-16 text-black/60 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <button
            onClick={() => navigate('/custom')}
            className="w-full sm:w-auto px-10 sm:px-12 py-4 bg-black text-white tracking-widest uppercase transition-all hover:bg-black/80 active:bg-black/70 group relative overflow-hidden"
          >
            <span className="relative z-10">{t('hero.cta')}</span>
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'linear-gradient(90deg, rgba(255,90,31,0.1), rgba(193,18,31,0.1))' }}
            />
          </button>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-0">
            {categories.map(({ key, title, desc, gradient, border }) => (
              <button
                key={key}
                onClick={() => navigate('/shop')}
                className={`group text-left cursor-pointer ${border} px-8 py-10 md:p-16 hover:bg-[#fafafa] active:bg-[#fafafa] transition-colors duration-500`}
              >
                <div className="space-y-6 md:space-y-8">
                  <div className="w-16 h-1" style={{ background: gradient }} />
                  <h3 className="text-2xl md:text-3xl tracking-tight">{title}</h3>
                  <p className="text-black/50 tracking-wide leading-relaxed text-sm md:text-base">{desc}</p>
                  <div className="flex items-center gap-2 text-black/60 group-hover:text-black transition-colors">
                    <span className="tracking-wide text-sm">{t('hero.explore')}</span>
                    <ArrowRight size={14} strokeWidth={1.5} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-20 md:py-40 px-6 md:px-12 bg-white relative overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(193,18,31,0.3) 0%, transparent 70%)' }}
        />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <p className="text-[1.6rem] sm:text-4xl md:text-5xl tracking-tight leading-[1.25] mb-8 md:mb-16 whitespace-pre-line">
            {t('hero.philosophy')}
          </p>
          <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 text-base md:text-lg tracking-wide text-black/60 leading-relaxed">
            <p>{t('hero.philP1')}</p>
            <p>{t('hero.philP2')}</p>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 md:py-32 px-6 md:px-12 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 md:mb-24">
            <h2 className="text-3xl sm:text-5xl md:text-6xl tracking-tight">{t('hero.processTitle')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10 md:gap-16">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="space-y-4 md:space-y-6">
                <div className="text-4xl md:text-6xl font-light text-black/20">{n}</div>
                <h3 className="text-xl md:text-2xl tracking-tight">{title}</h3>
                <p className="text-black/60 tracking-wide leading-relaxed text-sm md:text-base">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-40 px-6 md:px-8 bg-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255,90,31,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(255,195,0,0.1) 0%, transparent 50%)' }}
        />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl md:text-6xl tracking-tight mb-5 md:mb-12">{t('hero.ctaTitle')}</h2>
          <p className="text-base md:text-xl tracking-wide text-black/60 mb-8 md:mb-16 max-w-2xl mx-auto">{t('hero.ctaSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
            <button
              onClick={() => navigate('/shop')}
              className="w-full sm:w-auto px-10 sm:px-12 py-4 bg-black text-white tracking-widest uppercase hover:bg-black/80 active:bg-black/70 transition-colors"
            >
              {t('hero.shopNow')}
            </button>
            <button
              onClick={() => navigate('/custom')}
              className="w-full sm:w-auto px-10 sm:px-12 py-4 border border-black tracking-widest uppercase hover:bg-black hover:text-white active:bg-black active:text-white transition-colors"
            >
              {t('hero.customizeCta')}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
