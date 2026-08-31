import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './api';
import {
  CART_TOKEN_HEADER,
  addCartItem,
  applyDiscountCode,
  checkoutCart,
  fetchCart,
  openCart,
  removeCartItem,
  removeDiscountCode,
  requestPaymentLink,
  setCartItemQuantity,
} from './cartApi';
import { EMPTY_CHECKOUT } from '../content/checkout';
import { classifyFailure } from '../content/cart';

const TOKEN = 'FGBbStmAwN4jvVDrjg-dc83qbo1xNfkQRWU6EYLu0V4';

/** El carrito con una linea, copiado de una respuesta real del servidor. */
const CART = {
  token: TOKEN,
  currency: 'USD',
  items: [
    {
      id: 3,
      variant_id: 59,
      product_name: 'Tabla Feuoir Clasica',
      variant_name: 'Medida 7.75"',
      sku: 'FEU-TABLA-775',
      options: { Medida: '7.75"' },
      unit_price: '59.00',
      currency: 'USD',
      quantity: 2,
      line_total: '118.00',
    },
  ],
  totals: { subtotal: '118.00', shipping: '5.00', tax: '17.70', total: '140.70' },
  requires_tax_id: true,
};

/** Captura la peticion para poder afirmar sobre metodo, cuerpo y cabeceras. */
function respondWith(body: unknown, init: ResponseInit = {}) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), init));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Lo que se mando en la ultima llamada. */
function sent(fetchMock: ReturnType<typeof respondWith>) {
  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  return {
    url,
    method: init.method,
    headers: init.headers as Record<string, string>,
    body: init.body ? JSON.parse(init.body as string) : undefined,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('el token viaja en la cabecera', () => {
  it('cada peticion del carrito lleva X-Cart-Token', async () => {
    // En la ruta seria una credencial escrita donde se copia sola: historial,
    // `Referer` de recursos externos, registros de todo proxy del camino.
    const fetchMock = respondWith(CART);

    await fetchCart(TOKEN);

    expect(sent(fetchMock).headers[CART_TOKEN_HEADER]).toBe(TOKEN);
    expect(sent(fetchMock).url).not.toContain(TOKEN);
  });

  it('abrir el carrito no lleva token: todavia no hay ninguno', async () => {
    const fetchMock = respondWith({ ...CART, items: [], totals: { total: '0.00' } });

    await openCart();

    const request = sent(fetchMock);
    expect(request.method).toBe('POST');
    expect(request.headers[CART_TOKEN_HEADER]).toBeUndefined();
  });
});

describe('las escrituras devuelven el carrito entero', () => {
  it('agregar manda variante y cantidad, y no el precio', async () => {
    // Los precios no se aceptan del cliente: se leen del catalogo en el servidor.
    const fetchMock = respondWith(CART, { status: 201 });

    const cart = await addCartItem(TOKEN, 59, 2);

    expect(sent(fetchMock).body).toEqual({ variant_id: 59, quantity: 2 });
    // Con una sola respuesta la pantalla no puede quedar desincronizada: llegan
    // las lineas y los totales nuevos en el mismo viaje.
    expect(cart.items[0].sku).toBe('FEU-TABLA-775');
    expect(cart.totals.total).toBe('140.70');
  });

  it('cambiar la cantidad la fija, no la suma', async () => {
    const fetchMock = respondWith(CART);

    await setCartItemQuantity(TOKEN, 3, 4);

    const request = sent(fetchMock);
    expect(request.method).toBe('PATCH');
    expect(request.url).toContain('/cart/items/3/');
    expect(request.body).toEqual({ quantity: 4 });
  });

  it('quitar una linea devuelve el carrito ya actualizado', async () => {
    // Contesta 200 con cuerpo y no 204: despues de borrar cambian los totales, y
    // devolverlos evita el segundo viaje que el cliente tendria que hacer igual.
    const fetchMock = respondWith(CART);

    const cart = await removeCartItem(TOKEN, 3);

    expect(sent(fetchMock).method).toBe('DELETE');
    expect(cart.totals.total).toBe('140.70');
  });
});

describe('el cupon', () => {
  it('se manda tal como se escribio: lo normaliza el servidor', async () => {
    // `verano10`, `VERANO10` y ` Verano10 ` son el mismo cupon, y quien decide
    // eso es el backend. Normalizar aqui seria una segunda copia de esa regla.
    const fetchMock = respondWith({ ...CART, discount_code: 'VERANO10' });

    const cart = await applyDiscountCode(TOKEN, ' verano10 ');

    const request = sent(fetchMock);
    expect(request.url).toContain('/cart/discount/');
    expect(request.method).toBe('POST');
    expect(request.body).toEqual({ code: ' verano10 ' });
    expect(cart.discountCode).toBe('VERANO10');
  });

  it('un codigo que no corresponde se rechaza con su motivo', async () => {
    // Aceptarlo mostraria un cupon aplicado y un total sin cambios, que es peor.
    respondWith({ detail: 'El codigo BIENVENIDA10 no corresponde a esta compra.' }, { status: 400 });

    const error = await applyDiscountCode(TOKEN, 'BIENVENIDA10').catch((cause: unknown) => cause);

    expect(classifyFailure(error)).toBe('rejected');
    expect((error as ApiError).detail).toBe('El codigo BIENVENIDA10 no corresponde a esta compra.');
  });

  it('quitarlo devuelve el carrito y no toca las promociones automaticas', async () => {
    const fetchMock = respondWith({ ...CART, discount_code: '' });

    const cart = await removeDiscountCode(TOKEN);

    expect(sent(fetchMock).method).toBe('DELETE');
    expect(cart.discountCode).toBe('');
  });
});

describe('los desenlaces que documenta el contrato', () => {
  it('con la API caida distingue "no contesto" de "contesto que no"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      })
    );

    const error = await fetchCart(TOKEN).catch((cause: unknown) => cause);

    expect((error as ApiError).isNetworkFailure).toBe(true);
    expect(classifyFailure(error)).toBe('offline');
  });

  it('el token consumido responde 404 y se reconoce como tal', async () => {
    // Pasa siempre despues de un checkout: el servidor borra el carrito al
    // convertirlo en orden, y su token deja de servir en el mismo momento.
    respondWith({ detail: 'No hay ningun carrito con ese token.' }, { status: 404 });

    const error = await fetchCart(TOKEN).catch((cause: unknown) => cause);

    expect(classifyFailure(error)).toBe('gone');
    expect((error as ApiError).detail).toBe('No hay ningun carrito con ese token.');
  });

  it('una variante que no esta a la venta conserva el motivo del servidor', async () => {
    // Puede pasar entre que se abre la ficha y se pulsa el boton, y el motivo
    // exacto solo lo sabe el backend.
    respondWith({ detail: 'FEU-GORRA no esta a la venta.' }, { status: 400 });

    const error = await addCartItem(TOKEN, 59, 1).catch((cause: unknown) => cause);

    expect(classifyFailure(error)).toBe('rejected');
    expect((error as ApiError).detail).toBe('FEU-GORRA no esta a la venta.');
  });

  it('el limite de peticiones se distingue de un error cualquiera', async () => {
    // Hay throttling puesto: 120/min anonimo. No es un fallo de la tienda ni de
    // lo que se pidio, y mostrarlo como generico invita a reintentar en vano.
    respondWith({ detail: 'Request was throttled.' }, { status: 429 });

    const error = await addCartItem(TOKEN, 59, 1).catch((cause: unknown) => cause);

    expect(classifyFailure(error)).toBe('throttled');
  });

  it('lee el motivo tambien cuando llega como error de validacion', async () => {
    // El contrato documenta dos formas de cuerpo y las dos hay que saber leer.
    respondWith(
      { billing_address: { tax_id: ['Este campo es requerido.'] } },
      { status: 400 }
    );

    const error = await checkoutCart(TOKEN, EMPTY_CHECKOUT, true).catch((cause: unknown) => cause);

    expect((error as ApiError).detail).toBe('Este campo es requerido.');
  });

  it('un 500 con HTML no rompe al intentar leer el motivo', async () => {
    // Django en desarrollo contesta una traza en HTML, no JSON.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<!DOCTYPE html><h1>OperationalError</h1>', { status: 500 }))
    );

    const error = await fetchCart(TOKEN).catch((cause: unknown) => cause);

    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).detail).toBeNull();
  });
});

describe('checkoutCart', () => {
  it('manda los datos del comprador y ninguna linea', async () => {
    const fetchMock = respondWith(
      {
        order_number: 'FO-2026-E4BE5B5A',
        currency: 'USD',
        total_amount: '140.70',
        items: [],
      },
      { status: 201 }
    );

    const order = await checkoutCart(
      TOKEN,
      { ...EMPTY_CHECKOUT, email: 'ana@example.com', name: 'Ana Diaz', country: 'EC' },
      false
    );

    const request = sent(fetchMock);
    expect(request.url).toContain('/cart/checkout/');
    expect(request.headers[CART_TOKEN_HEADER]).toBe(TOKEN);
    expect(request.body.lines).toBeUndefined();
    expect(order.orderNumber).toBe('FO-2026-E4BE5B5A');
    expect(order.totals.total).toBe('140.70');
  });

  it('un carrito vacio se rechaza y el carrito sobrevive', async () => {
    // El rechazo revierte todo: el token sigue sirviendo despues del 400.
    respondWith({ detail: 'El carrito no tiene lineas.' }, { status: 400 });

    const error = await checkoutCart(TOKEN, EMPTY_CHECKOUT, false).catch((cause: unknown) => cause);

    expect(classifyFailure(error)).toBe('rejected');
    expect((error as ApiError).detail).toBe('El carrito no tiene lineas.');
  });
});

describe('requestPaymentLink', () => {
  it('pide el intento con el numero de orden, sin token de sesion', async () => {
    // Quien acaba de comprar no tiene sesion: conocer el numero es la credencial.
    const fetchMock = respondWith(
      { attempt: { id: 1, provider: 'whatsapp' }, checkout_url: 'https://wa.me/593990000000?text=hola' },
      { status: 201 }
    );

    const link = await requestPaymentLink('FO-2026-E4BE5B5A');

    expect(sent(fetchMock).url).toContain('/orders/FO-2026-E4BE5B5A/payment-attempts/');
    expect(link).toBe('https://wa.me/593990000000?text=hola');
  });

  it('sin enlace en la respuesta devuelve null en vez de una cadena vacia', async () => {
    // Quien lo use tiene que decidir explicitamente que mostrar, no pintar un
    // enlace roto.
    respondWith({ attempt: { id: 1 } }, { status: 201 });

    await expect(requestPaymentLink('FO-1')).resolves.toBeNull();
  });
});
