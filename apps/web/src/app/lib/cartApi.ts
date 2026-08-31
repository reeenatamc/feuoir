import { cartFromPayload, orderFromPayload } from '../content/cart';
import type { Cart, CartPayload, Order, OrderPayload } from '../content/cart';
import type { CheckoutForm } from '../content/checkout';
import { checkoutPayload } from '../content/checkout';
import { apiGet, apiSend } from './api';

/**
 * Las peticiones de la bolsa, separadas del estado que las usa.
 *
 * Mismo motivo que en `catalogApi.ts`: un hook necesita un arbol de React
 * montado para correr, y estas son funciones `async` puras sobre `fetch`. Asi
 * los desenlaces que mas importan -- el servidor caido, el token consumido, el
 * limite de peticiones -- se comprueban en la suite unitaria y no solo mirando
 * la pagina.
 */

/**
 * El token viaja en una cabecera propia, no en la ruta ni en una cookie.
 *
 * En la ruta seria una credencial escrita donde se copia sola: historial,
 * `Referer` de cualquier recurso externo, registros de todo proxy del camino.
 * Como cookie seria de terceros -- la API esta en otro origen -- y Safari ya las
 * bloquea. El contrato de la API razona las dos cosas y declara la cabecera en
 * `CORS_ALLOW_HEADERS`; sin eso el navegador falla el preflight y descarta el
 * pedido antes de mandarlo.
 */
export const CART_TOKEN_HEADER = 'X-Cart-Token';

function withToken(token: string): Record<string, string> {
  return { [CART_TOKEN_HEADER]: token };
}

/**
 * Abre una bolsa vacia y devuelve la suya con el token dentro.
 *
 * Se llama al agregar la primera pieza y no al cargar el sitio: abrir una bolsa
 * por visita deja una fila por cada persona que solo miro.
 */
export async function openCart(signal?: AbortSignal): Promise<Cart> {
  return cartFromPayload(await apiSend<CartPayload>('POST', '/cart/', { body: {}, signal }));
}

/** La bolsa guardada. `404` si el token ya no corresponde a ninguna. */
export async function fetchCart(token: string, signal?: AbortSignal): Promise<Cart> {
  return cartFromPayload(await apiGet<CartPayload>('/cart/', { headers: withToken(token), signal }));
}

/**
 * Agrega una variante.
 *
 * Todas las escrituras devuelven la bolsa entera y no solo la linea tocada: los
 * importes cambian con cada cambio, y con una sola respuesta la pantalla no
 * puede quedar desincronizada del servidor. Por eso ninguna de estas funciones
 * hace un segundo viaje para releer.
 */
export async function addCartItem(
  token: string,
  variantId: number,
  quantity: number,
  signal?: AbortSignal
): Promise<Cart> {
  const payload = await apiSend<CartPayload>('POST', '/cart/items/', {
    body: { variant_id: variantId, quantity },
    headers: withToken(token),
    signal,
  });
  return cartFromPayload(payload);
}

/**
 * Fija la cantidad de una linea. El minimo del contrato es 1: cero no vacia la
 * linea, para eso esta el borrado.
 */
export async function setCartItemQuantity(
  token: string,
  itemId: number,
  quantity: number,
  signal?: AbortSignal
): Promise<Cart> {
  const payload = await apiSend<CartPayload>('PATCH', `/cart/items/${itemId}/`, {
    body: { quantity },
    headers: withToken(token),
    signal,
  });
  return cartFromPayload(payload);
}

/**
 * Aplica un cupon.
 *
 * El codigo se guarda **en el carrito** y no en el checkout: es la pantalla
 * donde quien compra lo escribe y ve bajar el total, y es lo que garantiza que
 * el cobro no difiera de lo que mostro la pantalla anterior. El servidor lo
 * normaliza -- `verano10` y ` VERANO10 ` son el mismo cupon -- asi que aqui se
 * manda tal como se escribio.
 *
 * **400** si el codigo no existe o no descuenta nada en esta compra. Tambien se
 * rechaza un cupon real que no corresponde: aceptarlo mostraria un cupon
 * aplicado y un total sin cambios, que es peor que rechazarlo.
 */
export async function applyDiscountCode(
  token: string,
  code: string,
  signal?: AbortSignal
): Promise<Cart> {
  const payload = await apiSend<CartPayload>('POST', '/cart/discount/', {
    body: { code },
    headers: withToken(token),
    signal,
  });
  return cartFromPayload(payload);
}

/**
 * Quita el cupon. Las promociones automaticas siguen aplicandose: lo que se
 * quita es el codigo que alguien escribio, no la rebaja de temporada.
 */
export async function removeDiscountCode(token: string, signal?: AbortSignal): Promise<Cart> {
  const payload = await apiSend<CartPayload>('DELETE', '/cart/discount/', {
    headers: withToken(token),
    signal,
  });
  return cartFromPayload(payload);
}

/** Quita la linea. Contesta `200` con la bolsa ya actualizada, no `204`. */
export async function removeCartItem(
  token: string,
  itemId: number,
  signal?: AbortSignal
): Promise<Cart> {
  const payload = await apiSend<CartPayload>('DELETE', `/cart/items/${itemId}/`, {
    headers: withToken(token),
    signal,
  });
  return cartFromPayload(payload);
}

/**
 * Convierte la bolsa en orden.
 *
 * El servidor **consume el carrito**: su token deja de servir en el mismo
 * momento. Quien llame a esto tiene que borrar el token local, o el siguiente
 * `GET /api/cart/` respondera `404` para siempre.
 */
export async function checkoutCart(
  token: string,
  form: CheckoutForm,
  requiresTaxId: boolean,
  signal?: AbortSignal
): Promise<Order> {
  const payload = await apiSend<OrderPayload>('POST', '/cart/checkout/', {
    body: checkoutPayload(form, requiresTaxId),
    headers: withToken(token),
    signal,
  });
  return orderFromPayload(payload);
}

interface PaymentAttemptPayload {
  checkout_url?: string;
}

/**
 * Pide el intento de pago de una orden y devuelve el enlace para pagarla.
 *
 * Crear la orden no la cobra: son dos hechos distintos y el contrato los separa
 * a proposito, porque una orden admite varios intentos -- un rechazo y un
 * reintento quedan los dos registrados. El proveedor sale del adaptador activo
 * del servidor, asi que si mañana se enciende Stripe este mismo enlace lleva a
 * otro sitio sin tocar nada aqui.
 *
 * No hace falta token: conocer el numero de orden es la credencial, y quien
 * acaba de comprar todavia no tiene sesion.
 */
export async function requestPaymentLink(
  orderNumber: string,
  signal?: AbortSignal
): Promise<string | null> {
  const payload = await apiSend<PaymentAttemptPayload>(
    'POST',
    `/orders/${orderNumber}/payment-attempts/`,
    { body: {}, signal }
  );

  return typeof payload.checkout_url === 'string' && payload.checkout_url !== ''
    ? payload.checkout_url
    : null;
}
