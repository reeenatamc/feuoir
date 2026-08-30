import { describe, expect, it } from 'vitest';
import { SERIES_001_OBJECTS, countByState, findObject } from './objects';
import type { FeuoirObject } from './objects';
import { CURRENT_SERIES, objectCode, pad2, seriesCode } from './series';

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
    const c = countByState(SERIES_001_OBJECTS);
    expect(c.available + c.archived + c.private).toBe(SERIES_001_OBJECTS.length);
  });
});

describe('CURRENT_SERIES', () => {
  it('deriva sus contadores del listado y no de valores escritos a mano', () => {
    // Esta es la garantia que pidio el encargo: si hay 4 piezas y ninguna se
    // vendio, tiene que decir 04 disponibles y 00 archivadas, no inventarse un
    // archivo que no existe.
    expect(CURRENT_SERIES.counts).toEqual(countByState(SERIES_001_OBJECTS));
  });
});

describe('identidad de las piezas', () => {
  it('no hay dos piezas con el mismo numero dentro de la serie', () => {
    const numeros = SERIES_001_OBJECTS.map((o) => o.number);
    expect(new Set(numeros).size).toBe(numeros.length);
  });

  it('toda pieza tiene una edicion coherente: index dentro de of', () => {
    for (const o of SERIES_001_OBJECTS) {
      expect(o.edition.index).toBeGreaterThanOrEqual(1);
      expect(o.edition.index).toBeLessThanOrEqual(o.edition.of);
    }
  });

  it('toda pieza declara al menos un material', () => {
    for (const o of SERIES_001_OBJECTS) {
      expect(o.materials.length).toBeGreaterThan(0);
    }
  });

  it('solo las piezas disponibles llevan precio', () => {
    // Una pieza archivada con precio invita a intentar comprarla.
    for (const o of SERIES_001_OBJECTS) {
      if (o.price) expect(o.state).toBe('available');
    }
  });
});

describe('findObject', () => {
  it('encuentra por numero de serie, con ceros incluidos', () => {
    expect(findObject('003')?.name).toBe('Object T-03');
  });

  it('devuelve undefined si no existe, para que la ruta muestre su aviso', () => {
    expect(findObject('999')).toBeUndefined();
    expect(findObject('3')).toBeUndefined();
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
