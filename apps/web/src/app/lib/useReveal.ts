import { useEffect, useRef, useState } from 'react';

/**
 * Marca un elemento como visible la primera vez que entra en pantalla.
 *
 * Con `IntersectionObserver` y no escuchando el scroll: el navegador resuelve la
 * interseccion fuera del hilo principal, mientras que un listener de scroll
 * obliga a calcular posiciones en cada cuadro y es lo que vuelve pesada una
 * pagina con muchas piezas.
 *
 * Se desconecta al primer disparo. La aparicion es un hecho que ocurre una vez:
 * si el elemento volviera a desvanecerse al salir de pantalla, recorrer el
 * listado hacia arriba lo convertiria en un parpadeo constante.
 *
 * Con `prefers-reduced-motion` arranca visible y no se observa nada, asi que no
 * hay animacion ni trabajo de observacion que hacer.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(() => prefersReducedMotion());

  useEffect(() => {
    const el = ref.current;
    if (!el || revealed) return;

    // Sin soporte, mostrar de entrada: nunca dejar contenido invisible por una
    // capacidad ausente.
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRevealed(true);
        observer.disconnect();
      },
      // Un margen negativo abajo retrasa la aparicion hasta que la pieza esta
      // francamente dentro del encuadre, no asomando por el borde.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [revealed]);

  return { ref, revealed };
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
