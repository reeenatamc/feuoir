import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { TransitionLink } from '../lib/navigation';
import { useBag } from '../lib/CartProvider';
import { useMuseumUnderBar } from '../lib/useMuseumUnderBar';
import { ROUTES } from '../content/vocabulary';
import { pad2 } from '../content/series';

/** Las etiquetas se resuelven en el render, no aqui: si se guardaran ya
 *  traducidas, cambiar de idioma no las actualizaria. */
const NAV_LINKS = [
  { tKey: 'feuoirNav.objects', to: ROUTES.objects },
  { tKey: 'feuoirNav.archive', to: ROUTES.archive },
  { tKey: 'feuoirNav.commissions', to: ROUTES.commissions },
];

/**
 * Tratamiento tipografico unico para todo lo que no es el logotipo: cuerpo
 * pequeno y tracking abierto. La jerarquia la da el tamano y el espacio, no el
 * peso ni el color, que es lo que mantiene la barra en registro editorial.
 */
const NAV_TYPE = 'text-[10px] tracking-[0.26em] uppercase';

export function Navigation() {
  const [indexOpen, setIndexOpen] = useState(false);
  const { t, i18n } = useTranslation();

  // El contador sale del carrito del servidor y no de un estado local: es la
  // misma bolsa que edita `/bag`, y con dos copias la barra diria una cosa y la
  // pagina otra en cuanto una de las dos se recargara.
  const { count } = useBag();

  // La barra flota fuera de toda seccion y no hereda los tokens que cada sala
  // redefine en su ambito. El unico dato que necesita del exterior es sobre cual
  // esta flotando; que hacer con ese dato lo decide `modes.css`, que es donde
  // vive la paleta. Aqui no se escribe ningun color.
  const bar = useRef<HTMLElement>(null);
  const overMuseum = useMuseumUnderBar(bar);

  // En el home el logotipo grande del hero ya dice quien es: repetirlo en la
  // barra no agrega informacion y le quita aire al encabezado. Fuera del home no
  // hay nada mas que lo diga, y ahi la marca vuelve, en pequeno.
  //
  // La excepcion es el home en movil. Alli el logotipo grande no comparte
  // pantalla con la barra -- cae a media altura, cruzando el borde del video --
  // y arriba solo quedan INDICE y BOLSA contra el margen derecho: media cabecera.
  // Con la marca en pequeno a la izquierda la barra vuelve a tener dos extremos.
  const isHome = useLocation().pathname === '/';

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es');
  };

  // El indice cubre la pantalla: dejar la pagina scrolleando por debajo se siente
  // roto, y al cerrarlo el lector reaparece en un punto distinto del que dejo.
  useEffect(() => {
    if (!indexOpen) return;

    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const alEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndexOpen(false);
    };
    window.addEventListener('keydown', alEscape);

    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener('keydown', alEscape);
    };
  }, [indexOpen]);

  return (
    <>
      <nav
        ref={bar}
        data-surface={overMuseum ? 'museum' : undefined}
        className="fixed top-0 left-0 right-0 z-50 nav-bar"
      >
        <div className="max-w-[1600px] mx-auto px-6 md:px-10">
          <div className="relative flex items-center justify-between h-16 md:h-20">

            {/* El hueco se mantiene aunque no haya marca: sin el, el resto de la
                barra se recoloca al cambiar de ruta y la nav "salta".
                En el home se esconde desde `md` con CSS y no dejando de
                renderizarla: el ancho de la ventana no se conoce hasta que corre
                el JavaScript, y decidirlo ahi haria aparecer y desaparecer la
                marca en el primer pintado. */}
            <div className="flex items-center">
              <TransitionLink
                to="/"
                className={`flex items-center gap-2 text-sm lowercase transition-opacity hover:opacity-60${
                  isHome ? ' md:hidden' : ''
                }`}
                aria-label={t('brand.home')}
              >
                <img src="/flame.png" alt="" aria-hidden="true" className="nav-mark-flame" />
                <span aria-hidden="true">feuoir</span>
              </TransitionLink>
            </div>

            {/* Centrados desde `lg`. Por debajo vuelven al flujo: el
                posicionamiento absoluto los saca de el y se superponen con las
                utilidades de la derecha. */}
            <div className="hidden md:flex items-center gap-8 lg:gap-14 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
              {NAV_LINKS.map(({ tKey, to }) => (
                <TransitionLink
                  key={to}
                  to={to}
                  className={`${NAV_TYPE} transition-opacity hover:opacity-55`}
                >
                  {t(tKey)}
                </TransitionLink>
              ))}
            </div>

            <div className="flex items-center gap-5 md:gap-7">
              <button
                onClick={toggleLang}
                className={`${NAV_TYPE} hidden md:inline text-ink/45 hover:text-ink transition-colors`}
                aria-label={i18n.language === 'es' ? 'Switch to English' : 'Cambiar a español'}
              >
                <span aria-hidden="true">{i18n.language === 'es' ? 'ES / en' : 'es / EN'}</span>
              </button>

              {/* En movil es la unica via a las secciones; en desktop convive
                  con los enlaces del centro como acceso secundario, el que da la
                  vista completa del sitio de una sola vez. */}
              <button
                onClick={() => setIndexOpen(true)}
                className={`${NAV_TYPE} text-ink/45 hover:text-ink transition-colors`}
                aria-expanded={indexOpen}
              >
                {t('feuoirNav.index')}
              </button>

              {/* Sin icono de carrito: un pictograma de ecommerce dice "tienda"
                  antes que cualquier otra cosa. El contador alcanza. */}
              <TransitionLink
                to={ROUTES.bag}
                className={`${NAV_TYPE} tabular-nums transition-opacity hover:opacity-60`}
              >
                {t('feuoirNav.bag')} {pad2(count)}
              </TransitionLink>
            </div>
          </div>
        </div>
      </nav>

      {/* Indice a pantalla completa, en lugar del desplegable con hamburguesa:
          misma funcion, registro editorial. Se abre en cualquier tamano, asi que
          repite las medidas de la barra (alto, margenes, ancho maximo) para que
          al abrirlo la marca y el cierre caigan donde ya estaban. */}
      {indexOpen && (
        <div className="fixed inset-0 z-[60] bg-surface flex flex-col">
          <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10 flex items-center justify-between h-16 md:h-20">
            <span className="flex items-center gap-2 text-sm lowercase">
              <img src="/flame.png" alt="" aria-hidden="true" className="nav-mark-flame" />
              feuoir
            </span>
            <button onClick={() => setIndexOpen(false)} className={`${NAV_TYPE} text-ink/45`}>
              {t('feuoirNav.close')}
            </button>
          </div>

          <div className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col justify-center px-6 md:px-10 pb-24">
            {NAV_LINKS.map(({ tKey, to }, i) => (
              // Enlaces y no botones: se abren en otra pestana con el modificador,
              // el navegador anuncia a donde llevan, y el teclado los recorre como
              // navegacion y no como controles sueltos.
              <TransitionLink
                key={to}
                to={to}
                onClick={() => setIndexOpen(false)}
                className="text-left py-5 md:py-8 border-b border-ink/10 flex items-baseline gap-5 md:gap-10 transition-opacity hover:opacity-55"
              >
                {/* El ordinal es decorativo: sin ocultarlo, el nombre accesible
                    del enlace pasa a ser "01 Objetos". */}
                <span
                  aria-hidden="true"
                  className="text-[10px] tracking-[0.26em] text-ink/35 tabular-nums"
                >
                  {pad2(i + 1)}
                </span>
                {/* A pantalla completa el enlace es el contenido, no una entrada
                    de menu: crece con el ancho como creceria un titular. */}
                <span className="text-2xl md:text-5xl lg:text-6xl tracking-[-0.02em]">
                  {t(tKey)}
                </span>
              </TransitionLink>
            ))}

            {/* Mismo nombre accesible que su gemelo de la barra: el texto visible
                dice a que idioma, la etiqueta dice que la accion es cambiarlo. */}
            <button
              onClick={toggleLang}
              aria-label={i18n.language === 'es' ? 'Switch to English' : 'Cambiar a español'}
              className="text-left py-5 md:py-8 text-[10px] tracking-[0.26em] uppercase text-ink/45 hover:text-ink transition-colors"
            >
              <span aria-hidden="true">{i18n.language === 'es' ? 'English' : 'Español'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
