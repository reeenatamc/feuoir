import { SERIES_001_OBJECTS, countByState } from './objects';
import type { ObjectState } from './objects';

/**
 * Datos de la serie vigente.
 *
 * Hoy la fuente es el modulo de piezas, pero la forma es la que va a devolver el
 * backend, no una que haya que reescribir despues. Sustitucion prevista:
 * `GET /api/series/current`.
 */
export interface SeriesMeta {
  /** Numero de serie, ya con el formato de la identidad: `001`. */
  number: string;
  /** Donde se produce. */
  origin: string;
  year: number;
  /**
   * Cuantas piezas hay en cada estado. Derivado, nunca escrito a mano: es el
   * mismo hecho que el listado de piezas, y declararlo aparte garantiza que
   * tarde o temprano discrepen.
   */
  counts: Record<ObjectState, number>;
}

export const CURRENT_SERIES: SeriesMeta = {
  number: '001',
  origin: 'Loja — Ecuador',
  year: 2026,
  counts: countByState(SERIES_001_OBJECTS),
};

/**
 * Codigo de identidad de una pieza: `S001 / O008 / 2026`.
 *
 * Vive aqui y no en la vista porque el mismo codigo tiene que aparecer igual en
 * la ficha, en el archivo, en el certificado y en el packaging. Si cada sitio lo
 * arma por su cuenta, tarde o temprano dejan de coincidir.
 */
export function objectCode(seriesNumber: string, objectNumber: string, year: number): string {
  return `S${seriesNumber} / O${objectNumber} / ${year}`;
}

/**
 * Codigo de la serie sola: `S001 / 2026`.
 *
 * Hermana de `objectCode` y esta aqui por lo mismo: la identidad se arma en un
 * unico sitio. La vista pide el codigo, no lo concatena, asi que cambiar el
 * formato es cambiar esta linea y no buscar cadenas por los componentes.
 */
export function seriesCode(seriesNumber: string, year: number): string {
  return `S${seriesNumber} / ${year}`;
}

/** Numeros a dos digitos, como se muestran en la metadata del hero. */
export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}
