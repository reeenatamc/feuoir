import { describe, expect, it } from 'vitest';
import {
  countByState,
  findObject,
  objectFromPayload,
  objectsFromPayload,
  saleVariantFromProduct,
} from './objects';
import type { FeuoirObject, ObjectPayload } from './objects';
import { objectCode, pad2, seriesCode, seriesFromPayload } from './series';

/**
 * Una pieza tal como la manda `GET /api/series/001/objects/`.
 *
 * Copiada de una respuesta real del servidor, no de un esquema idealizado: el
 * valor de esta suite depende de que la forma sea la que llega de verdad.
 */
function payload(overrides: Partial<ObjectPayload> = {}): ObjectPayload {
  return {
    id: 39,
    name: 'Ceniza',
    slug: 'ceniza-001-001',
    description: 'Pieza 001 de la serie 001.',
    category: 'Skate',
    status: 'active',
    price: '240.00',
    price_from: '240.00',
    variant_count: 1,
    images: [],
    number: '001',
    series: '001',
    year: 2026,
    state: 'available',
    materials: ['steel', 'griptape'],
    treatment: { kind: 'thermal', number: '01' },
    edition: { index: 1, of: 1 },
    ...overrides,
  } as ObjectPayload;
}

describe('objectFromPayload', () => {
  it('traduce una pieza completa', () => {
    expect(objectFromPayload(payload())).toEqual({
      number: '001',
      series: '001',
      year: 2026,
      slug: 'ceniza-001-001',
      name: 'Ceniza',
      state: 'available',
      materials: ['steel', 'griptape'],
      treatment: { kind: 'thermal', number: '01' },
      edition: { index: 1, of: 1 },
      images: [],
      price: '240.00',
    });
  });

  it('conserva el precio como texto, con sus decimales intactos', () => {
    // Es el motivo por el que el backend lo manda como cadena. `Number('240.00')`
    // vale 240 y al mostrarlo pierde los centavos; en otros importes ademas
    // cambia el ultimo decimal.
    const precio = objectFromPayload(payload({ price: '240.00' }))?.price;

    expect(precio).toBe('240.00');
    expect(typeof precio).toBe('string');
  });

  it('descarta articulos que no son piezas de serie', () => {
    // Ruedas y rodamientos viven en el mismo modelo y llegan por otros
    // endpoints con estos campos vacios. El archivo lista piezas numeradas.
    expect(objectFromPayload(payload({ number: '', series: null, state: '' }))).toBeNull();
    expect(objectFromPayload(payload({ year: null }))).toBeNull();
    expect(objectFromPayload(payload({ slug: '' }))).toBeNull();
  });

  it('descarta un estado que no es del vocabulario de la casa', () => {
    // `active` es el estado editorial del producto, no el comercial de la pieza.
    expect(objectFromPayload(payload({ state: 'active' }))).toBeNull();
  });

  it('olvida el precio de lo que ya no esta a la venta', () => {
    // El servidor conserva el importe de una pieza archivada porque es parte de
    // su historia; publicarlo invita a intentar comprarla.
    expect(objectFromPayload(payload({ state: 'archived' }))?.price).toBeNull();
    expect(objectFromPayload(payload({ state: 'private' }))?.price).toBeNull();
  });

  it('deja fuera los materiales que no sabe nombrar', () => {
    // Sin traduccion, la ficha mostraria `material.wood` a quien la lea.
    const object = objectFromPayload(payload({ materials: ['steel', 'wood'] }));

    expect(object?.materials).toEqual(['steel']);
  });

  it('acepta piezas sin tratamiento ni edicion', () => {
    // El backend los declara opcionales y la ficha omite esas filas.
    const object = objectFromPayload(payload({ treatment: null, edition: null }));

    expect(object?.treatment).toBeNull();
    expect(object?.edition).toBeNull();
  });

  it('rechaza una edicion incoherente en vez de mostrarla', () => {
    // `3 / 1` no es una edicion, es un dato roto.
    expect(objectFromPayload(payload({ edition: { index: 3, of: 1 } }))?.edition).toBeNull();
  });

  it('rechaza un tratamiento que no sabe redactar', () => {
    // Solo existe la frase del tratamiento termico.
    expect(objectFromPayload(payload({ treatment: { kind: 'chemical', number: '01' } }))?.treatment)
      .toBeNull();
  });

  it('traduce las fotografias con su punto focal y su srcset', () => {
    const object = objectFromPayload(
      payload({
        images: [
          {
            alt: 'Tabla de frente',
            width: 1560,
            height: 2400,
            focal_point: { x: 40, y: 20 },
            src: 'https://cdn/960.webp',
            sources: [{ type: 'image/avif', srcset: 'https://cdn/320.avif 320w' }],
          },
        ],
      })
    );

    expect(object?.images).toEqual([
      {
        alt: 'Tabla de frente',
        width: 1560,
        height: 2400,
        focalPoint: { x: 40, y: 20 },
        src: 'https://cdn/960.webp',
        sources: [{ type: 'image/avif', srcset: 'https://cdn/320.avif 320w' }],
      },
    ]);
  });
});

describe('objectsFromPayload', () => {
  it('filtra lo que no son piezas y conserva el orden del servidor', () => {
    const objects = objectsFromPayload([
      payload({ number: '001', slug: 'a' }),
      payload({ number: '', series: null, state: '', slug: 'ruedas' }),
      payload({ number: '002', slug: 'b' }),
    ]);

    expect(objects.map((o) => o.number)).toEqual(['001', '002']);
  });

  it('una respuesta vacia o ausente da una lista vacia, no un fallo', () => {
    expect(objectsFromPayload([])).toEqual([]);
    expect(objectsFromPayload(null)).toEqual([]);
  });
});

describe('saleVariantFromProduct', () => {
  it('devuelve el identificador y la moneda juntos, que es donde viven', () => {
    // A la bolsa se agrega una variante, no un producto, y el precio tambien es
    // suyo. Salen del mismo sitio para que la ficha no pueda mostrar la moneda
    // de una variante y agregar otra.
    expect(saleVariantFromProduct({ variants: [{ id: 70, currency: 'USD' }] })).toEqual({
      id: 70,
      currency: 'USD',
    });
  });

  it('sin variantes no inventa ninguna', () => {
    // Preferible callar el precio a publicarlo sin decir en que moneda esta, y
    // no ofrecer el boton antes que ofrecer uno que va a fallar al pulsarlo.
    expect(saleVariantFromProduct({ variants: [] })).toBeNull();
    expect(saleVariantFromProduct({})).toBeNull();
  });

  it('ignora una moneda que la aplicacion no maneja', () => {
    expect(
      saleVariantFromProduct({ variants: [{ id: 1, currency: 'JPY' }, { id: 2, currency: 'EUR' }] })
    ).toEqual({ id: 2, currency: 'EUR' });
  });

  it('descarta la variante que el servidor marca inactiva', () => {
    // Agregarla daria un 400: se rechaza al agregar lo que no esta a la venta.
    expect(
      saleVariantFromProduct({
        variants: [
          { id: 1, currency: 'USD', is_active: false },
          { id: 2, currency: 'USD', is_active: true },
        ],
      })
    ).toEqual({ id: 2, currency: 'USD' });
  });

  it('sin identificador no sirve, aunque traiga moneda', () => {
    // La moneda sola no permite comprar, y la ficha necesita las dos cosas.
    expect(saleVariantFromProduct({ variants: [{ currency: 'USD' }] })).toBeNull();
  });
});

describe('countByState', () => {
  it('cuenta cada estado por separado', () => {
    const piezas = [
      { state: 'available' },
      { state: 'available' },
      { state: 'archived' },
      { state: 'private' },
    ] as FeuoirObject[];

    expect(countByState(piezas)).toEqual({ available: 2, archived: 1, private: 1 });
  });

  it('devuelve ceros con una lista vacia, no un objeto incompleto', () => {
    // Importa: la vista lee `counts.archived` sin comprobar, y un `undefined`
    // aqui se mostraria como "NaN ARCHIVADO" en el hero.
    expect(countByState([])).toEqual({ available: 0, archived: 0, private: 0 });
  });

  it('la suma de los contadores es el total de piezas', () => {
    const objects = objectsFromPayload([
      payload({ number: '001', slug: 'a', state: 'available' }),
      payload({ number: '002', slug: 'b', state: 'archived' }),
      payload({ number: '003', slug: 'c', state: 'private' }),
    ]);
    const c = countByState(objects);

    expect(c.available + c.archived + c.private).toBe(objects.length);
  });
});

describe('seriesFromPayload', () => {
  it('deriva los contadores del listado y no de los que manda el servidor', () => {
    // El servidor cuenta piezas publicadas y la pagina muestra las que recibio.
    // Un encabezado que dice `09 DISPONIBLE` sobre una lista de dos filas hace
    // dudar de todo lo demas.
    const objects = objectsFromPayload([
      payload({ number: '001', slug: 'a', state: 'available' }),
      payload({ number: '002', slug: 'b', state: 'archived' }),
    ]);

    const series = seriesFromPayload(
      { number: '001', year: 2026, counts: { available: 9, archived: 9, private: 9 } },
      objects
    );

    expect(series.counts).toEqual({ available: 1, archived: 1, private: 0 });
  });

  it('conserva el numero y el año tal como llegan', () => {
    expect(seriesFromPayload({ number: '002', year: 2027 }, [])).toEqual({
      number: '002',
      year: 2027,
      counts: { available: 0, archived: 0, private: 0 },
    });
  });
});

describe('findObject', () => {
  const objects = objectsFromPayload([
    payload({ number: '003', slug: 'pavesa-001-003', name: 'Pavesa' }),
  ]);

  it('encuentra por numero de serie, con ceros incluidos', () => {
    expect(findObject(objects, '003')?.name).toBe('Pavesa');
  });

  it('devuelve undefined si no existe, para que la ruta muestre su aviso', () => {
    expect(findObject(objects, '999')).toBeUndefined();
    expect(findObject(objects, '3')).toBeUndefined();
  });
});

describe('codigos de identidad', () => {
  it('el codigo de pieza tiene el formato que va en etiqueta y certificado', () => {
    expect(objectCode('001', '008', 2026)).toBe('S001 / O008 / 2026');
  });

  it('el codigo de serie omite la pieza', () => {
    expect(seriesCode('001', 2026)).toBe('S001 / 2026');
  });

  it('pad2 rellena solo cuando hace falta', () => {
    expect(pad2(0)).toBe('00');
    expect(pad2(9)).toBe('09');
    expect(pad2(12)).toBe('12');
    expect(pad2(120)).toBe('120');
  });
});
