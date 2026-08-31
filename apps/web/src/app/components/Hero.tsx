import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTransitionNavigate } from '../lib/navigation';
import { useCurrentSeries } from '../lib/useCatalog';
import { useHeroBackground } from '../lib/useHeroBackground';
import { useMediaQuery } from '../lib/useMediaQuery';
import { SeriesSection } from './SeriesSection';
import { fire } from '../theme/color';
import { pickVideoSources } from '../theme/hero-image';
import { useUiMode } from '../theme/UiModeProvider';
import { usesHeroMedia } from '../theme/ui-mode';
import { HERO_MOTION_QUERY } from '../content/hero';
import { pad2, seriesCode } from '../content/series';
import { ROUTES } from '../content/vocabulary';

/** El nombre de la marca no se traduce, asi que no pasa por i18n. */
const BRAND = 'feuoir';

/** Una entrada de la metadata del hero: etiqueta pequena, valor pequeno. */
function Meta({ children }: { children: ReactNode }) {
  // Un punto mas de opacidad que antes: el velo inferior bajo para recuperar el
  // asfalto, y con `/45` estos datos quedaban por debajo del umbral de lectura.
  return <span className="block text-[10px] tracking-[0.26em] uppercase text-ink/55">{children}</span>;
}

export function Hero() {
  const navigate = useTransitionNavigate();
  const { t } = useTranslation();
  const { mode } = useUiMode();
  // El fondo sale del panel. La foto la coloca el hook escribiendo tokens, y
  // aqui solo se usa su descripcion. El video, en cambio, es un elemento: no hay
  // token que lo haga aparecer, asi que su presencia si se decide en el JSX.
  //
  // Dos condiciones, y ninguna es opcional: que el modo lleve fondo y que nadie
  // haya pedido menos movimiento. Se comprueban ANTES de montarlo porque un
  // `<video autoplay>` escondido con CSS se descarga igual.
  const wantsMotion = useMediaQuery(HERO_MOTION_QUERY);
  const playsVideo = wantsMotion && usesHeroMedia(mode);
  const { image: heroImage, video: heroVideo } = useHeroBackground(playsVideo);
  const videoSources = playsVideo && heroVideo ? pickVideoSources(heroVideo, window.innerWidth) : [];

  // La serie se pide una sola vez para toda la home y se baja a <SeriesSection>:
  // los contadores de aqui y la retícula de abajo son el mismo listado, y con
  // una consulta por componente podrian no coincidir.
  const catalog = useCurrentSeries();
  const { series } = catalog;

  // En el modo de marca el hero es el nombre, no una frase: es el gesto de la
  // referencia, donde el titular ES la firma del sitio y el resto lo explica
  // abajo. El modo sobrio conserva la frase original.
  const isBrandHero = mode === 'cool';

  return (
    <>
      {/* Hero Section */}
      {/* Dos formas, no dos heros. Desde `md` la seccion ocupa la ventana entera
          y la foto va a sangre por detras del titular. Por debajo la foto es una
          banda con proporcion propia -- en una ventana en vertical `cover` se
          queda con una franja central ampliada casi cuatro veces, y ahi la escena
          -- la mujer, el fuego -- cae fuera -- y el bloque editorial monta sobre
          su borde inferior, que es lo que evita que se lean como dos secciones.
          Cual de las dos formas toma la seccion lo resuelven `.hero-section` y
          `.hero-band` en modes.css; el arbol es el mismo en las dos. */}
      <section className="hero-section relative overflow-hidden bg-surface">
        {/* Fondo en tres capas apiladas por orden de aparicion en el DOM: foto,
            video encima, y el velo sobre los dos. El velo es una capa aparte y
            no el primer plano del `background-image` de la foto porque entre
            medio tiene que caber el video, y el fondo de un elemento se pinta
            siempre por detras de sus hijos.
            `dvh` y no `vh`: en escritorio da igual, pero la unidad es la misma
            que usa el resto del sitio y `100vh` cuenta la barra de direcciones.
            Las tres capas viven dentro de un contenedor propio para que la
            banda las dimensione a la vez con una sola regla. */}
        <div className="hero-band">
          {/* Que haya foto o no lo decide el modo activo via --hero-image, y
              cual es la foto lo decide el panel via --hero-image-src. Este
              componente no hace ninguna de las dos cosas.
              Con descripcion cargada la foto es contenido y se anuncia; sin ella
              es decoracion detras del titular y se oculta, que es lo correcto
              para un fondo que nadie describio. */}
          <div
            className="absolute inset-0 hero-backdrop"
            role={heroImage.alt ? 'img' : undefined}
            aria-label={heroImage.alt || undefined}
            aria-hidden={heroImage.alt ? undefined : true}
          />

          {/* El video repite lo que ya dice la foto de abajo, asi que se oculta
              a los lectores de pantalla: anunciarlo seria describir dos veces el
              mismo fondo.
              `muted` y `playsInline` no son preferencias: sin ellos ningun
              navegador movil arranca la reproduccion sola. `poster` apunta al
              mismo archivo que pinta la capa de la foto, de modo que el
              navegador lo pide una sola vez y no hay salto entre el poster y el
              fondo. */}
          {videoSources.length > 0 && (
            <video
              className="absolute inset-0 hero-video"
              poster={heroImage.src}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
            >
              {videoSources.map((source) => (
                <source key={source.src} src={source.src} type={source.type} />
              ))}
            </video>
          )}

          <div className="absolute inset-0 hero-scrim" aria-hidden="true" />
        </div>

        {/* Alineacion, escala del titular y forma del CTA vienen de tokens
            (`.hero-*` en modes.css). El padding superior mide lo que la nav, que
            es fixed y flota encima: donde el titular comparte sitio con ella lo
            despeja. En movil no hace falta -- la banda ya despejo la barra -- y
            ahi el bloque sube hasta cruzar el borde del video (ver
            `.hero-content` en la consulta de medios). */}
        <div className="hero-content relative z-10 w-full px-6 md:px-10 pt-16 md:pt-20">
          {/* Menos aire que en escritorio: el reclamo tiene que leerse como la
              segunda voz del logotipo y no como un parrafo aparte. */}
          <h1 className="hero-title mb-4 md:mb-9 whitespace-pre-line">
            {isBrandHero ? BRAND : t('hero.title')}
          </h1>

          {isBrandHero ? (
            <>
              {/* El reclamo enuncia la irrepetibilidad como un hecho. No lleva
                  parrafo explicativo: la pagina no tiene que argumentar que es
                  exclusiva, tiene que comportarse como si lo fuera. */}
              <p className="hero-claim mb-3 md:mb-4">{t('brand.claim')}</p>
              {/* Tracking mas corto y algo mas de contraste que el resto de la
                  metadata: es una linea larga sobre foto, y con el tracking de
                  las etiquetas sueltas se leia como un patron y no como texto.
                  Sigue siendo metadata, no un segundo titular. */}
              <p className="text-[10px] tracking-[0.14em] uppercase text-ink/65 mb-7 md:mb-14">
                {t('brand.claimSecondary')}
              </p>
            </>
          ) : (
            <p className="hero-subtitle text-sm md:text-base tracking-wide leading-relaxed mb-8 md:mb-12 text-ink/65">
              {t('hero.subtitle')}
            </p>
          )}

          {/* Referencia editorial, no boton: sin caja, sin relleno, sin radio.
              Una linea fina debajo basta para que se lea como accionable. */}
          <button
            onClick={() => navigate(ROUTES.objects)}
            className="hero-cta inline-flex items-center gap-3 text-[11px] tracking-[0.25em] uppercase transition-opacity hover:opacity-60"
          >
            {/* Mientras la serie no llega, la referencia nombra su destino en
                vez de un numero que todavia no se sabe. El enlace lleva al mismo
                sitio en los dos casos, asi que nunca queda inerte. */}
            <span>
              {isBrandHero
                ? series
                  ? t('series.title', { number: series.number })
                  : t('feuoirNav.objects')
                : t('hero.cta')}
            </span>
            <ArrowUpRight className="hero-cta-arrow" size={13} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {/* Metadata del archivo. Pequena y secundaria: su trabajo es que la
            pagina parezca un registro vivo, no anunciarse. */}
        {/* Sin serie cargada no hay metadata: la portada no es el sitio para
            avisar de un servidor caido, y la seccion de la serie -- justo
            debajo -- ya lo dice con todas las letras. */}
        {/* Desde `md` se ancla al pie de la foto. En movil no hay foto debajo a
            la que anclarse: sigue a la referencia con el aire justo para leerse
            como el pie del mismo bloque editorial y no como el pie de la
            pantalla. El relleno inferior es el margen de la portada antes de la
            sala siguiente, y por eso es mayor que el superior. */}
        {isBrandHero && series && (
          <div className="hero-meta relative z-10 px-6 pb-14 pt-6 md:absolute md:inset-x-0 md:bottom-0 md:px-10 md:pb-9 md:pt-0">
            {/* En movil las dos columnas no entran enfrentadas y la derecha se
                sale de pantalla: ahi se apilan, y los contadores pasan a una
                sola fila. Desde `md` vuelven a enfrentarse. */}
            <div className="max-w-[1600px] mx-auto flex flex-col gap-2.5 md:flex-row md:items-end md:justify-between md:gap-8">
              {/* Solo el codigo: el nombre de la serie ya esta arriba, en el CTA,
                  y la procedencia no se publica todavia. */}
              <Meta>{seriesCode(series.number, series.year)}</Meta>
              {/* Contadores derivados del listado de piezas que llego, nunca
                  copiados de un contador aparte: en produccion no se inventan
                  piezas archivadas para que la serie parezca mas grande. Si hay
                  4 objetos y no se vendio ninguno, aqui tiene que decir
                  `04 DISPONIBLE / 00 ARCHIVADO`.
                  El margen extra los saca del borde donde termina la nav: con
                  todo enfrentado al mismo eje el hero vuelve a leerse como un
                  container centrado y no como una portada. */}
              <div className="flex gap-6 md:block md:space-y-1 md:text-right md:me-8 tabular-nums">
                <Meta>
                  {pad2(series.counts.available)} {t('state.available')}
                </Meta>
                <Meta>
                  {pad2(series.counts.archived)} {t('state.archived')}
                </Meta>
              </div>
            </div>
          </div>
        )}
      </section>

      <SeriesSection catalog={catalog} />

      {/* Philosophy */}
      <section className="py-20 md:py-40 px-6 md:px-12 bg-surface relative overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            filter: 'blur(var(--glow-blur))',
            opacity: 'var(--glow-hero)',
            background: `radial-gradient(circle, ${fire('red', 30)} 0%, transparent 70%)`,
          }}
        />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <p className="text-[1.6rem] sm:text-4xl md:text-5xl tracking-tight leading-[1.25] mb-8 md:mb-16 whitespace-pre-line">
            {t('hero.philosophy')}
          </p>
          <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 text-base md:text-lg tracking-wide text-ink/60 leading-relaxed">
            <p>{t('hero.philP1')}</p>
          </div>
        </div>
      </section>

    </>
  );
}
