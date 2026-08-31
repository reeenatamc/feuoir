import type { Page, Route } from '@playwright/test';

/**
 * El carrito que ve la suite.
 *
 * Mismo criterio que `catalog.ts`: los recorridos interceptan la red en vez de
 * hablar con el backend. Aqui pesa todavia mas, porque los desenlaces que
 * importan no se le pueden pedir a un servidor de verdad: un token consumido, la
 * API caida y un limite de peticiones no se provocan a voluntad y se deshacen en
 * la prueba siguiente.
 *
 * Las formas estan copiadas de respuestas reales (`curl` sobre `/api/cart/`) y
 * viven en un unico archivo, asi que actualizarlas cuando el backend cambie es
 * editar aqui y no repasar la suite.
 */

const CART = '**/api/cart/';
const CART_ITEMS = '**/api/cart/items/';
const CART_ITEM = '**/api/cart/items/*/';
const DISCOUNT = '**/api/cart/discount/';
const CHECKOUT = '**/api/cart/checkout/';
const PAYMENT = '**/api/orders/*/payment-attempts/';

export const TOKEN = 'FGBbStmAwN4jvVDrjg-dc83qbo1xNfkQRWU6EYLu0V4';

export const STORAGE_KEY = 'feuoir_cart_token';

export const ORDER_NUMBER = 'FO-2026-E4BE5B5A';

/**
 * El cupon que hay cargado en la base de desarrollo.
 *
 * No hay ninguna promocion automatica a proposito, asi que nada cambia los
 * totales sin que la prueba lo pida.
 */
export const CUPON = 'VERANO10';

/**
 * Los importes de una bolsa con `unidades` piezas.
 *
 * Copiados de respuestas reales del servidor (`curl` sobre `/api/cart/items/`).
 * Cumplen la invariante del contrato -- `total = subtotal - discount + tax +
 * shipping` -- y con el cupon puesto dejan de cumplir la suma ingenua de los
 * cuatro conceptos visibles: 240.00 + 5.00 + 32.40 da 277.40 y se cobra 248.40.
 * Es lo que hace fallar la prueba si alguien decide sumar en el cliente.
 */
function importes(unidades: number, conCupon: boolean) {
  if (conCupon) {
    // 10% sobre la mercaderia (24.00) mas el envio regalado (5.00) = 29.00.
    // El impuesto sale de 216.00, no de 240.00. Y el envio sigue diciendo 5.00.
    return { subtotal: '240.00', discount: '29.00', shipping: '5.00', tax: '32.40', total: '248.40' };
  }

  const tabla = [
    { subtotal: '240.00', discount: '0.00', shipping: '5.00', tax: '36.00', total: '281.00' },
    { subtotal: '480.00', discount: '0.00', shipping: '5.00', tax: '72.00', total: '557.00' },
  ];

  return tabla[unidades - 1] ?? tabla[0];
}

/**
 * Las promociones aplicadas: una con codigo sobre la mercaderia y un envio
 * gratis automatico, que es el caso que mas facil se dibuja mal.
 */
function promociones(conCupon: boolean) {
  if (!conCupon) return [];

  return [
    {
      code_used: CUPON,
      name: 'Rebajas de temporada',
      discount_type: 'percentage',
      value: '10.00',
      scope: 'order',
      base_amount: '240.00',
      amount_applied: '24.00',
    },
    {
      code_used: '',
      name: 'Envio gratis sobre 100',
      discount_type: 'percentage',
      value: '100.00',
      scope: 'shipping',
      base_amount: '5.00',
      amount_applied: '5.00',
    },
  ];
}

/** La bolsa con una pieza, tal como la devuelve cualquier escritura. */
export function bolsa(unidades = 1, conCupon = false) {
  return {
    token: TOKEN,
    currency: 'USD',
    items: [
      {
        id: 3,
        variant_id: 70,
        product_name: 'Ceniza',
        variant_name: 'Pieza unica',
        sku: 'FEU-S001-O001',
        options: {},
        unit_price: '240.00',
        currency: 'USD',
        quantity: unidades,
        // Bruto: lo que se cobra por la linea es la resta con `discount_amount`.
        line_total: unidades === 1 ? '240.00' : '480.00',
        discount_amount: conCupon ? '24.00' : '0.00',
      },
    ],
    totals: importes(unidades, conCupon),
    discount_code: conCupon ? CUPON : '',
    discounts: promociones(conCupon),
    requires_tax_id: true,
  };
}

/** La bolsa recien abierta, sin lineas. Un carrito vacio no cuesta el envio. */
export const BOLSA_VACIA = {
  token: TOKEN,
  currency: 'USD',
  items: [],
  totals: { subtotal: '0.00', discount: '0.00', shipping: '0.00', tax: '0.00', total: '0.00' },
  discount_code: '',
  discounts: [],
  requires_tax_id: false,
};

/** La orden, con los importes planos que manda `POST /api/cart/checkout/`. */
export const ORDEN = {
  id: 14,
  order_number: ORDER_NUMBER,
  status: 'pending',
  payment_status: 'pending',
  requires_tax_id: true,
  currency: 'USD',
  // La orden los manda planos; la bolsa, anidados en `totals`. Se dibujan igual.
  subtotal_amount: '480.00',
  discount_amount: '0.00',
  shipping_amount: '5.00',
  tax_amount: '72.00',
  total_amount: '557.00',
  items: [
    {
      id: 15,
      product_name: 'Ceniza',
      variant_name: 'Pieza unica',
      sku: 'FEU-S001-O001',
      options_snapshot: {},
      unit_price: '240.00',
      currency: 'USD',
      quantity: 2,
      line_total: '480.00',
      discount_amount: '0.00',
    },
  ],
  discounts: [],
  addresses: [],
};

const ENLACE_DE_PAGO = `https://wa.me/593990000000?text=Hola%21%20Quiero%20pagar%20la%20orden%20${ORDER_NUMBER}.`;

/**
 * Sirve el carrito completo, con estado.
 *
 * Guarda las unidades entre peticiones porque el recorrido que importa las
 * cambia: agregar, sumar una y confirmar. Con respuestas fijas, la prueba pasaria
 * igual aunque la pagina ignorara lo que el servidor contesta.
 */
export async function servirBolsa(
  page: Page,
  { existe = false }: { existe?: boolean } = {}
) {
  const estado = { unidades: existe ? 1 : 0, consumida: false, cupon: false };

  const actual = () =>
    estado.unidades > 0 ? bolsa(estado.unidades, estado.cupon) : BOLSA_VACIA;

  await page.route(CART, (route: Route) => {
    // Abrir y leer comparten ruta y se distinguen por el metodo, igual que en la
    // API: `POST /api/cart/` crea, `GET /api/cart/` lee.
    if (route.request().method() === 'POST') {
      estado.unidades = 0;
      estado.consumida = false;
      return route.fulfill({ status: 201, json: BOLSA_VACIA });
    }

    if (estado.consumida) {
      return route.fulfill({ status: 404, json: { detail: 'No hay ningun carrito con ese token.' } });
    }

    return route.fulfill({ json: actual() });
  });

  await page.route(CART_ITEMS, (route: Route) => {
    estado.unidades += 1;
    return route.fulfill({ status: 201, json: actual() });
  });

  await page.route(CART_ITEM, (route: Route) => {
    if (route.request().method() === 'DELETE') {
      estado.unidades = 0;
      return route.fulfill({ json: BOLSA_VACIA });
    }

    const { quantity } = route.request().postDataJSON() as { quantity: number };
    estado.unidades = quantity;
    return route.fulfill({ json: actual() });
  });

  await page.route(DISCOUNT, (route: Route) => {
    if (route.request().method() === 'DELETE') {
      estado.cupon = false;
      return route.fulfill({ json: actual() });
    }

    const { code } = route.request().postDataJSON() as { code: string };

    // El servidor normaliza el codigo -- mayusculas y sin espacios -- y por eso
    // el cliente lo manda tal como se escribio.
    if (code.trim().toUpperCase() !== CUPON) {
      return route.fulfill({
        status: 400,
        json: { detail: `El codigo ${code.trim()} no corresponde a esta compra.` },
      });
    }

    estado.cupon = true;
    return route.fulfill({ json: actual() });
  });

  await page.route(CHECKOUT, (route: Route) => {
    // El servidor consume el carrito al convertirlo: su token deja de servir en
    // el mismo momento, y de ahi en adelante `GET /api/cart/` responde 404.
    estado.consumida = true;
    estado.unidades = 0;
    return route.fulfill({ status: 201, json: ORDEN });
  });

  await page.route(PAYMENT, (route: Route) =>
    route.fulfill({
      status: 201,
      json: {
        attempt: { id: 1, provider: 'whatsapp', status: 'pending', checkout_url: ENLACE_DE_PAGO },
        checkout_url: ENLACE_DE_PAGO,
      },
    })
  );

  return estado;
}

/** Deja un token guardado, como si la visita anterior hubiera dejado la bolsa. */
export async function conTokenGuardado(page: Page) {
  await page.addInitScript(
    ([clave, valor]) => window.localStorage.setItem(clave, valor),
    [STORAGE_KEY, TOKEN] as const
  );
}

/** El token que hay guardado en este navegador, o `null`. */
export function tokenGuardado(page: Page) {
  return page.evaluate((clave) => window.localStorage.getItem(clave), STORAGE_KEY);
}

/** Deja la API del carrito sin responder, y cuenta los intentos. */
export async function romperBolsa(page: Page) {
  let intentos = 0;

  await page.route('**/api/cart/**', (route: Route) => {
    intentos += 1;
    return route.abort('failed');
  });

  return () => intentos;
}

/** Responde 404 a todo el carrito: es lo que queda tras un checkout. */
export async function bolsaConsumida(page: Page) {
  let intentos = 0;

  await page.route('**/api/cart/**', (route: Route) => {
    intentos += 1;
    return route.fulfill({
      status: 404,
      json: { detail: 'No hay ningun carrito con ese token.' },
    });
  });

  return () => intentos;
}
