import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { useLocation } from 'react-router';

/**
 * La sala clara, tal como la nombra `modes.css`.
 *
 * Es el unico punto donde este modulo conoce una clase del CSS. Se declara
 * aparte para que quien renombre la sala encuentre aqui el otro sitio que hay
 * que tocar.
 */
const MUSEUM_SECTION = '.section--museum';

/**
 * Si la barra fija esta flotando sobre la sala clara.
 *
 * La barra es hermana de <main>: vive FUERA de toda seccion, asi que no ve los
 * tokens que la sala clara redefine en su ambito y se queda con la tinta del
 * modo. En el modo oscuro eso deja crema sobre crema en cuanto la sala pasa por
 * debajo, y la barra desaparece.
 *
 * Hay que mirarlo desde JavaScript porque no existe forma de preguntarlo en CSS:
 * ningun selector expresa "que hay detras de este elemento fijo". La alternativa
 * -- que la barra lleve siempre un velo -- exige la misma observacion para saber
 * cuando encenderlo, y ademas dibuja una franja sobre la portada, que es
 * justamente lo que el modo evita con `--surface-nav: transparent`.
 *
 * Se sondea la LINEA MEDIA de la barra y no su recuadro entero: lo que decide la
 * legibilidad es lo que hay detras del texto, no lo que asoma por un borde
 * mientras la seccion todavia esta entrando.
 *
 * Con `IntersectionObserver` y no escuchando el scroll, por el mismo motivo que
 * `useReveal`: el navegador resuelve la interseccion sin obligar a medir
 * posiciones en cada cuadro.
 */
export function useMuseumUnderBar(bar: RefObject<HTMLElement | null>): boolean {
  const [overMuseum, setOverMuseum] = useState(false);
  // Al cambiar de ruta cambian las secciones montadas, y un observador solo
  // conoce las que existian cuando se creo.
  const { pathname } = useLocation();

  useEffect(() => {
    const barNode = bar.current;
    // Sin soporte se responde que no: la tinta del modo es la que se lee sobre
    // la portada, que es donde la barra pasa mas tiempo.
    if (!barNode || typeof IntersectionObserver === 'undefined') return;

    // Las secciones que cubren la linea de sondeo. Se guardan todas y no un
    // booleano suelto porque durante el relevo hay dos a la vez: la que entra
    // avisa antes de que la que sale avise que se fue.
    const covering = new Set<Element>();
    let observer: IntersectionObserver | null = null;

    const observe = () => {
      observer?.disconnect();
      covering.clear();

      // El recuadro raiz se reduce a una franja de 1px sobre la linea media de
      // la barra. En pixeles y no en porcentaje porque el porcentaje seria del
      // alto de la ventana, y lo que hay que anclar es el alto de la barra.
      const probe = Math.round(barNode.getBoundingClientRect().height / 2);
      const below = Math.max(window.innerHeight - probe - 1, 0);

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) covering.add(entry.target);
            else covering.delete(entry.target);
          }
          setOverMuseum(covering.size > 0);
        },
        { rootMargin: `-${probe}px 0px -${below}px 0px` }
      );

      const sections = document.querySelectorAll(MUSEUM_SECTION);
      // Sin nada que observar el observador no vuelve a disparar nunca, asi que
      // el estado de la ruta anterior se quedaria pegado.
      if (sections.length === 0) setOverMuseum(false);
      for (const section of sections) observer.observe(section);
    };

    observe();
    // La franja depende del alto de la ventana y del alto de la barra, y los dos
    // cambian: al girar el telefono y al cruzar el punto de corte `md`.
    window.addEventListener('resize', observe);

    return () => {
      window.removeEventListener('resize', observe);
      observer?.disconnect();
    };
  }, [bar, pathname]);

  return overMuseum;
}
