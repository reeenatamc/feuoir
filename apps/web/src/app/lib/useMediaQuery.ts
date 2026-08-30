import { useEffect, useState } from 'react';

/**
 * Sigue una consulta de medios desde React.

 * Existe porque hay decisiones que no son de apariencia sino de ESTRUCTURA:
 * si el hero reproduce un video o no, por ejemplo, no se puede resolver con un
 * token CSS -- un `<video>` oculto con `display: none` igual se descarga.
 * Para eso hay que preguntar antes de renderizar, y eso es esto.
 *
 * Se escucha el cambio en vez de leerlo una vez: girar el telefono o mover el
 * borde de la ventana cambia la respuesta, y quedarse con la primera lectura
 * deja la pagina comportandose como el tamano que ya no tiene.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => matchesNow(query));

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const list = window.matchMedia(query);
    const update = (event: MediaQueryListEvent) => setMatches(event.matches);
    // La consulta pudo cambiar entre el primer render y este efecto.
    setMatches(list.matches);

    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);

  return matches;
}

function matchesNow(query: string): boolean {
  // Sin `matchMedia` se responde que no: ante la duda, la version quieta.
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query).matches
    : false;
}
