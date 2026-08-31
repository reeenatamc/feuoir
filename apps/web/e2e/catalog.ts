import type { Page, Route } from '@playwright/test';

/**
 * El catalogo que ve la suite.
 *
 * Los recorridos interceptan la red y sirven estas respuestas en vez de hablar
 * con el backend. La razon es que una prueba tiene que fallar por una sola cosa:
 * porque la aplicacion dejo de comportarse como se decidio. Contra la base de
 * desarrollo, la misma suite pasa hoy y falla mañana porque alguien archivo una
 * pieza -- y una suite que depende del dia no dice nada cuando esta en verde.
 *
 * Ademas es la unica forma de recorrer lo que mas importa: que la pagina diga
 * algo cuando el servidor no contesta. Eso no se puede pedir a un servidor real
 * en una prueba y deshacerlo en la siguiente.
 *
 * La contrapartida es que estas respuestas podrian alejarse del contrato. Se
 * acota de dos maneras: la forma esta copiada de respuestas reales del servidor
 * (`curl` sobre `/api/series/001/objects/`), y vive en un unico archivo, asi que
 * actualizarla cuando el backend cambie es editar aqui y no repasar la suite.
 */

const SERIES_CURRENT = '**/api/series/current/';
const SERIES_OBJECTS = '**/api/series/*/objects/';
const PRODUCT = '**/api/products/*/';

/**
 * La serie vigente.
 *
 * `counts` viene deliberadamente equivocado. El frontend deriva los contadores
 * del listado que pinta, y con estos numeros cualquier recorrido que los
 * compruebe falla si alguien decide copiarlos del servidor.
 */
export const SERIE = {
  number: '001',
  year: 2026,
  title: 'Primera serie',
  description: 'Piezas unicas, numeradas y firmadas.',
  is_current: true,
  counts: { available: 9, archived: 9, private: 9 },
};

/**
 * Fotografia de una pieza, con el contrato de `srcset` del backend.
 *
 * Apunta a archivos que existen en `public/` y en los dos formatos que declara:
 * un `<source type="image/avif">` que sirviera un PNG haria que el navegador lo
 * eligiera, fallara al decodificar y dejara el hueco vacio, sin volver atras.
 */
const FOTO = {
  id: 1,
  alt: 'Ceniza sobre fondo claro',
  width: 1920,
  height: 992,
  focal_point: { x: 62, y: 38 },
  src: '/hero-poster.webp',
  sources: [
    { type: 'image/avif', srcset: '/hero-poster.avif 1920w' },
    { type: 'image/webp', srcset: '/hero-poster.webp 960w, /hero-poster.webp 1920w' },
  ],
};

/**
 * Las piezas de la serie: dos disponibles, una archivada y un encargo privado.
 *
 * Cada una cubre un caso: 001 tiene fotografia y precio, 002 declara un solo
 * material para poder comprobar la traduccion exacta, 003 esta archivada y
 * conserva importe en el servidor, y 004 nunca estuvo a la venta.
 */
export const PIEZAS = [
  {
    id: 39,
    name: 'Ceniza',
    slug: 'ceniza-001-001',
    description: 'Pieza 001 de la serie 001.',
    category: 'Skate',
    status: 'active',
    price: '240.00',
    price_from: '240.00',
    variant_count: 1,
    images: [FOTO],
    number: '001',
    series: '001',
    year: 2026,
    state: 'available',
    materials: ['steel', 'griptape'],
    treatment: { kind: 'thermal', number: '01' },
    edition: { index: 1, of: 1 },
  },
  {
    id: 40,
    name: 'Rescoldo',
    slug: 'rescoldo-001-002',
    description: 'Pieza 002 de la serie 001.',
    category: 'Skate',
    status: 'active',
    price: '190.00',
    price_from: '190.00',
    variant_count: 1,
    images: [],
    number: '002',
    series: '001',
    year: 2026,
    state: 'available',
    materials: ['cotton'],
    treatment: { kind: 'thermal', number: '02' },
    edition: { index: 1, of: 1 },
  },
  {
    id: 41,
    name: 'Pavesa',
    slug: 'pavesa-001-003',
    description: 'Pieza 003 de la serie 001.',
    category: 'Skate',
    status: 'active',
    price: '310.00',
    price_from: '310.00',
    variant_count: 1,
    images: [],
    number: '003',
    series: '001',
    year: 2026,
    state: 'archived',
    materials: ['leather', 'brass'],
    treatment: { kind: 'thermal', number: '03' },
    edition: { index: 1, of: 1 },
  },
  {
    id: 42,
    name: 'Tizon',
    slug: 'tizon-001-004',
    description: 'Pieza 004 de la serie 001.',
    category: 'Skate',
    status: 'active',
    price: null,
    price_from: null,
    variant_count: 0,
    images: [],
    number: '004',
    series: '001',
    year: 2026,
    state: 'private',
    materials: ['steel', 'brass'],
    treatment: { kind: 'thermal', number: '04' },
    edition: { index: 1, of: 1 },
  },
];

/** El producto de una pieza. La ficha lo pide por slug, por su moneda. */
const PRODUCTO = { variants: [{ id: 70, sku: 'FEU-S001-O001', currency: 'USD' }] };

/** Sirve el catalogo completo. Cada parte se puede sustituir por recorrido. */
export async function servirCatalogo(
  page: Page,
  { serie = SERIE, piezas = PIEZAS }: { serie?: unknown; piezas?: unknown[] } = {}
) {
  await page.route(SERIES_CURRENT, (route: Route) => route.fulfill({ json: serie }));
  await page.route(SERIES_OBJECTS, (route: Route) => route.fulfill({ json: piezas }));
  await page.route(PRODUCT, (route: Route) => route.fulfill({ json: PRODUCTO }));
}

/**
 * Deja la API sin responder y avisa cuando la pagina ya lo intento.
 *
 * Devuelve el contador para poder afirmar que el intento ocurrio: sin eso, un
 * recorrido pasaria igual comprobando el estado anterior a la peticion.
 */
export async function romperCatalogo(page: Page) {
  let intentos = 0;

  await page.route('**/api/series/**', (route: Route) => {
    intentos += 1;
    return route.abort('failed');
  });

  return () => intentos;
}
