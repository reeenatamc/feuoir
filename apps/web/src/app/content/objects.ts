import type { CurrencyCode } from '@feuoir/shared';

/**
 * Estado de una pieza.
 *
 * El vocabulario es el de la casa: una pieza no se agota ni se descataloga,
 * pasa al archivo. `private` es una commission que existe y se registra, pero
 * nunca estuvo a la venta.
 */
export type ObjectState = 'available' | 'archived' | 'private';

/**
 * Materiales, como claves y no como texto.
 *
 * Guardar `'Cotton'` obligaria a que el dato viniera ya traducido del backend, o
 * a mostrarlo en ingles a un lector en español. Con una clave, el dato es el
 * mismo en todos los idiomas y la traduccion vive donde corresponde: en i18n,
 * bajo `material.*`.
 */
export type MaterialKey = 'cotton' | 'steel' | 'leather' | 'brass' | 'griptape';

/** Tratamiento aplicado. Mismo criterio: clave mas dato, no frase armada. */
export interface Treatment {
  kind: 'thermal';
  number: string;
}

export interface FeuoirObject {
  /** Numero dentro de la serie, con el formato de la identidad: `008`. */
  number: string;
  /** Serie a la que pertenece: `001`. */
  series: string;
  year: number;
  /** Nombre propio de la pieza. No se traduce: es su nombre, no una etiqueta. */
  name: string;
  state: ObjectState;
  materials: MaterialKey[];
  treatment: Treatment;
  /** Tamano de la edicion. `{ index: 1, of: 1 }` es una pieza unica. */
  edition: { index: number; of: number };
  /**
   * Fotografia de la pieza. Opcional a proposito: una pieza puede estar
   * registrada antes de tener fotos, y el listado no debe romperse por eso.
   */
  image?: string;
  /**
   * Precio. Deliberadamente opcional y ausente del listado: en el archivo el
   * precio es un dato de la ficha, no el titular de la pieza.
   */
  price?: { amount: number; currency: CurrencyCode };
}

const unica = { index: 1, of: 1 };
const termico = (number: string): Treatment => ({ kind: 'thermal', number });

/**
 * Piezas de la serie vigente.
 *
 * Sustitucion prevista: `GET /api/series/001/objects`. La forma ya es la que va
 * a llegar del backend, incluido que `image` y `price` puedan faltar.
 */
export const SERIES_001_OBJECTS: FeuoirObject[] = [
  { number: '001', series: '001', year: 2026, name: 'Burn Jacket I',  state: 'archived',  materials: ['cotton', 'steel'],   treatment: termico('01'), edition: unica },
  { number: '002', series: '001', year: 2026, name: 'Scar Object',    state: 'archived',  materials: ['leather'],           treatment: termico('02'), edition: unica },
  { number: '003', series: '001', year: 2026, name: 'Object T-03',    state: 'available', materials: ['cotton'],            treatment: termico('03'), edition: unica, price: { amount: 180, currency: 'USD' } },
  { number: '004', series: '001', year: 2026, name: 'Burn Jacket II', state: 'private',   materials: ['cotton', 'steel'],   treatment: termico('04'), edition: unica },
  { number: '005', series: '001', year: 2026, name: 'Ash Grip',       state: 'archived',  materials: ['griptape'],          treatment: termico('02'), edition: { index: 1, of: 4 } },
  { number: '006', series: '001', year: 2026, name: 'Object T-06',    state: 'archived',  materials: ['cotton'],            treatment: termico('03'), edition: unica },
  { number: '007', series: '001', year: 2026, name: 'Ember Lighter',  state: 'available', materials: ['brass'],             treatment: termico('01'), edition: { index: 2, of: 6 }, price: { amount: 90, currency: 'USD' } },
  { number: '008', series: '001', year: 2026, name: 'Scar Object II', state: 'archived',  materials: ['leather', 'steel'],  treatment: termico('04'), edition: unica },
  { number: '009', series: '001', year: 2026, name: 'Object T-09',    state: 'archived',  materials: ['cotton'],            treatment: termico('03'), edition: unica },
  { number: '010', series: '001', year: 2026, name: 'Burn Hood',      state: 'available', materials: ['cotton'],            treatment: termico('05'), edition: unica, price: { amount: 240, currency: 'USD' } },
  { number: '011', series: '001', year: 2026, name: 'Cinder Grip',    state: 'archived',  materials: ['griptape'],          treatment: termico('02'), edition: { index: 3, of: 4 } },
  { number: '012', series: '001', year: 2026, name: 'Object T-12',    state: 'archived',  materials: ['cotton', 'brass'],   treatment: termico('03'), edition: unica },
  { number: '013', series: '001', year: 2026, name: 'Scorch Panel',   state: 'archived',  materials: ['steel'],             treatment: termico('05'), edition: unica },
];

/**
 * Cuantas piezas hay en cada estado.
 *
 * Se calcula sobre la lista en vez de escribirse a mano: los contadores del hero
 * y el listado del archivo son el mismo hecho, y si se declaran por separado
 * terminan discrepando en cuanto alguien agregue una pieza y se olvide del otro
 * sitio.
 */
export function countByState(objects: FeuoirObject[]): Record<ObjectState, number> {
  return objects.reduce(
    (acc, obj) => {
      acc[obj.state] += 1;
      return acc;
    },
    { available: 0, archived: 0, private: 0 } as Record<ObjectState, number>
  );
}

/** Busca una pieza por su numero dentro de la serie. */
export function findObject(number: string): FeuoirObject | undefined {
  return SERIES_001_OBJECTS.find((o) => o.number === number);
}
