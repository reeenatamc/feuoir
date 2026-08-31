/**
 * Donde vive el token del carrito.
 *
 * El token es la unica credencial del carrito: quien lo tenga es el dueño. Eso
 * obliga a elegir donde guardarlo con criterio, y hay dos candidatos reales.
 *
 * **Se elige `localStorage`.** Sobrevive al cierre del navegador, y eso es
 * exactamente lo que una tienda quiere: quien deja una pieza en la bolsa un
 * martes la encuentra ahi el miercoles, que es cuando vuelve a decidir. Con
 * `sessionStorage` el carrito muere al cerrar la pestaña y la compra empieza de
 * cero; en una tienda de piezas caras, que se piensan, eso es perder ventas por
 * una decision tecnica.
 *
 * La contrapartida es real y hay que decirla: `localStorage` lo lee cualquier
 * script que corra en la pagina, asi que un XSS se lleva el token. Se acepta
 * porque lo que ese token autoriza esta acotado -- ver y editar una bolsa, y
 * crear una orden que despues se cobra a mano por WhatsApp -- y porque no hay
 * alternativa mejor disponible: la cookie `HttpOnly`, que si estaria fuera del
 * alcance de un script, no sirve aqui. El frontend corre en otro origen que la
 * API, con lo que seria una cookie de terceros: Safari ya las bloquea y Chrome
 * va en camino, y el carrito dejaria de funcionar en parte de los navegadores.
 * El contrato de la API razona esa misma decision del lado del servidor.
 *
 * Mismo resguardo que `theme/ui-mode.ts` e `i18n/config.ts`: `localStorage`
 * puede tirar (Safari en modo privado, cookies bloqueadas) y no existe fuera del
 * navegador, asi que nunca se accede sin `try/catch`. Sin ese resguardo, un
 * navegador en modo privado no se quedaria sin carrito: se quedaria sin sitio.
 */

const STORAGE_KEY = 'feuoir_cart_token';

/** El token guardado, o `null` si no hay ninguno o no se pudo leer. */
export function readCartToken(): string | null {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    return typeof stored === 'string' && stored !== '' ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Guarda el token. Si no se puede, el carrito sigue funcionando en esta pestaña
 * y se pierde al recargar: peor que persistirlo, mejor que no poder comprar.
 */
export function storeCartToken(token: string): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, token);
  } catch {
    // Persistir es best-effort; no vale romper la compra por esto.
  }
}

/**
 * Borra el token.
 *
 * Se llama en cuanto el token deja de servir, y eso pasa siempre despues de un
 * checkout: el servidor borra el carrito al convertirlo en orden. Sin este
 * borrado, el siguiente `GET /api/cart/` responderia `404` para siempre y la
 * bolsa quedaria rota en ese navegador hasta que alguien limpiara el sitio a
 * mano.
 */
export function clearCartToken(): void {
  try {
    globalThis.localStorage?.removeItem(STORAGE_KEY);
  } catch {
    // Si no se pudo escribir, tampoco habia nada guardado que borrar.
  }
}
