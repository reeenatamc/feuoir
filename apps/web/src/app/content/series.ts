import { countByState } from './objects';
import type { FeuoirObject, ObjectState } from './objects';

/**
 * Datos de la serie vigente, tal como los devuelve `GET /api/series/current/`.
 */
export interface SeriesMeta {
  /** Numero de serie, ya con el formato de la identidad: `001`. */
  number: string;
  year: number;
  /**
   * Cuantas piezas hay en cada estado. Derivado del listado que se pinta, nunca
   * copiado de otro sitio: es el mismo hecho que la lista de piezas, y tomarlo
   * de otra fuente garantiza que tarde o temprano discrepen.
   */
  counts: Record<ObjectState, number>;
}

/** La serie tal como llega en el JSON. */
export interface SeriesPayload {
  number: string;
  year: number;
  counts?: Record<string, number>;
}

/**
 * Arma la serie a partir de su JSON y del listado de piezas ya traducido.
 *
 * El servidor manda sus propios `counts` y aqui se ignoran a proposito. No es
 * desconfianza: el servidor cuenta las piezas publicadas y la pagina muestra las
 * que recibio, y esos dos conjuntos pueden diferir por un filtro, una pagina o
 * una pieza que el frontend descarto por no saber nombrarla. Un encabezado que
 * dice `05 DISPONIBLE` sobre una lista de cuatro filas es peor que un numero
 * mas chico: hace dudar de todo lo demas.
 */
export function seriesFromPayload(payload: SeriesPayload, objects: FeuoirObject[]): SeriesMeta {
  return {
    number: payload.number,
    year: payload.year,
    counts: countByState(objects),
  };
}

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
