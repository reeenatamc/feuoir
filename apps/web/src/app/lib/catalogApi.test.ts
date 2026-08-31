import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './api';
import { loadObjectRecord, loadSeriesCatalog } from './catalogApi';

/** La serie vigente, como la manda `GET /api/series/current/`. */
const SERIES = {
  number: '001',
  year: 2026,
  title: 'Primera serie',
  is_current: true,
  // A proposito distintos de lo que trae el listado: el frontend los ignora.
  counts: { available: 9, archived: 9, private: 9 },
};

function piece(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'ceniza-001-001',
    name: 'Ceniza',
    number: '001',
    series: '001',
    year: 2026,
    state: 'available',
    materials: ['steel'],
    treatment: { kind: 'thermal', number: '01' },
    edition: { index: 1, of: 1 },
    images: [],
    price: '240.00',
    ...overrides,
  };
}

/**
 * Enruta por URL en vez de por orden de llamada: asi la prueba falla si el
 * codigo pide otra cosa, en vez de darle la respuesta del viaje siguiente.
 */
function routes(table: Record<string, unknown>) {
  const calls: string[] = [];

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      calls.push(url);
      const match = Object.keys(table).find((path) => url.endsWith(path));
      if (!match) return new Response(JSON.stringify({ detail: 'no existe' }), { status: 404 });
      return new Response(JSON.stringify(table[match]), { status: 200 });
    })
  );

  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('loadSeriesCatalog', () => {
  it('pide la serie vigente y despues sus piezas', async () => {
    const calls = routes({
      '/series/current/': SERIES,
      '/series/001/objects/': [piece()],
    });

    const { series, objects } = await loadSeriesCatalog();

    // El numero de la segunda ruta sale de la primera respuesta, no del codigo.
    expect(calls[0]).toContain('/series/current/');
    expect(calls[1]).toContain('/series/001/objects/');
    expect(series.number).toBe('001');
    expect(objects).toHaveLength(1);
  });

  it('los contadores salen de las piezas recibidas, no de los del servidor', async () => {
    routes({
      '/series/current/': SERIES,
      '/series/001/objects/': [piece(), piece({ number: '002', state: 'archived' })],
    });

    const { series } = await loadSeriesCatalog();

    expect(series.counts).toEqual({ available: 1, archived: 1, private: 0 });
  });

  it('con el servidor caido falla con un ApiError que lo dice', async () => {
    // Es la diferencia que decide el mensaje de la pagina: "no contesto" no es
    // lo mismo que "contesto que no", y el catalogo no tiene respaldo que
    // mostrar en ninguno de los dos casos.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      })
    );

    const error = await loadSeriesCatalog().catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isNetworkFailure).toBe(true);
  });

  it('sin serie vigente propaga el 404 en vez de fingir una serie vacia', async () => {
    // Una tienda sin serie marcada y un servidor roto no son lo mismo, y la
    // pagina no deberia contarlos como uno solo.
    routes({});

    const error = await loadSeriesCatalog().catch((cause: unknown) => cause);

    expect((error as ApiError).status).toBe(404);
  });
});

describe('loadObjectRecord', () => {
  it('resuelve el numero de la URL contra el listado y busca la variante por slug', async () => {
    // El numero es la identidad de la pieza; el slug es como se pide el producto.
    const calls = routes({
      '/series/current/': SERIES,
      '/series/001/objects/': [piece()],
      '/products/ceniza-001-001/': { variants: [{ id: 70, currency: 'USD' }] },
    });

    const { object, variant } = await loadObjectRecord('001');

    expect(object?.slug).toBe('ceniza-001-001');
    // De aqui salen las dos cosas que la ficha necesita: en que moneda esta el
    // precio, y que variante agregar a la bolsa.
    expect(variant).toEqual({ id: 70, currency: 'USD' });
    expect(calls[2]).toContain('/products/ceniza-001-001/');
  });

  it('sin precio no va a buscar la variante', async () => {
    // Un encargo privado no esta a la venta: el viaje seria para descartarlo.
    const calls = routes({
      '/series/current/': SERIES,
      '/series/001/objects/': [piece({ state: 'private' })],
    });

    const { object, variant } = await loadObjectRecord('001');

    expect(object?.state).toBe('private');
    expect(variant).toBeNull();
    expect(calls).toHaveLength(2);
  });

  it('un numero que no existe devuelve null sin fallar', async () => {
    // La ficha lo distingue de un error: avisa y ofrece volver a la serie.
    routes({
      '/series/current/': SERIES,
      '/series/001/objects/': [piece()],
    });

    await expect(loadObjectRecord('999')).resolves.toEqual({ object: null, variant: null });
  });

  it('si falla la consulta del producto, la ficha sobrevive sin precio ni boton', async () => {
    // Ocultar una cifra es una degradacion aceptable; publicarla sin moneda no,
    // y ofrecer un boton que no sabe que variante agregar, tampoco.
    // El fallo se registra en consola, y aqui se silencia para no ensuciar la
    // salida de la suite con un error que la prueba provoca a proposito.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    routes({
      '/series/current/': SERIES,
      '/series/001/objects/': [piece()],
    });

    const { object, variant } = await loadObjectRecord('001');

    expect(object?.name).toBe('Ceniza');
    expect(variant).toBeNull();
  });
});
