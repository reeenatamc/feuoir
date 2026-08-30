/**
 * Rutas del sitio, en el vocabulario de la casa.
 *
 * Aqui no vive ningun texto visible: todo lo que se lee pasa por i18n, para que
 * el conmutador ES/EN cambie la pagina de verdad. Las rutas son otra cosa —
 * forman parte de la URL, no de la interfaz, y no se traducen: un enlace
 * compartido tiene que seguir resolviendo en cualquier idioma.
 *
 * Las rutas anteriores (`/shop`, `/custom`, `/cart`) siguen resolviendo a lo
 * mismo, para no romper enlaces ni marcadores existentes.
 */
export const ROUTES = {
  objects: '/objects',
  archive: '/archive',
  commissions: '/commissions',
  bag: '/bag',
} as const;

/** Ficha de una pieza: `/objects/008`. */
export function objectRoute(objectNumber: string): string {
  return `${ROUTES.objects}/${objectNumber}`;
}
