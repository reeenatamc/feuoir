import type { CurrencyCode } from '@feuoir/shared';
import { imagesFromPayload } from './images';
import type { ImagePayload, ObjectImage } from './images';

/**
 * Las piezas de una serie, tal como las devuelve
 * `GET /api/series/{numero}/objects/`.
 *
 * Este modulo declara la forma y traduce el JSON; no guarda ninguna pieza. Las
 * trece que vivian aqui escritas a mano eran un andamio hasta que existiera el
 * backend, y mantenerlas ahora significaria tener dos catalogos: el que se
 * publica y el que se prueba.
 *
 * Lo que si queda es el contrato -- los tipos y las reglas del vocabulario --
 * porque es lo que impide que un cambio del servidor entre en las vistas sin que
 * nadie lo note.
 */

/**
 * Estado de una pieza.
 *
 * El vocabulario es el de la casa: una pieza no se agota ni se descataloga,
 * pasa al archivo. `private` es una commission que existe y se registra, pero
 * nunca estuvo a la venta.
 *
 * No es el `status` editorial del producto (`active`, `draft`): el backend
 * mantiene los dos separados a proposito y el catalogo solo lee este.
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

/** Tamano de la edicion. `{ index: 1, of: 1 }` es una pieza unica. */
export interface Edition {
  index: number;
  of: number;
}

export interface FeuoirObject {
  /** Numero dentro de la serie, con el formato de la identidad: `008`. */
  number: string;
  /** Serie a la que pertenece: `001`. */
  series: string;
  year: number;
  /**
   * Direccion de la pieza como producto en la API: `ceniza-001-001`.
   *
   * La identidad editorial es serie + numero, y es lo que va en la URL y en la
   * etiqueta. El slug es otra cosa: como se pide la pieza a `/api/products/`,
   * donde vive lo comercial (variantes, moneda, inventario).
   */
  slug: string;
  /** Nombre propio de la pieza. No se traduce: es su nombre, no una etiqueta. */
  name: string;
  state: ObjectState;
  materials: MaterialKey[];
  /**
   * Tratamiento y edicion pueden faltar: el backend los declara opcionales
   * porque no toda su mercaderia es una pieza de serie. La ficha omite la fila
   * en vez de inventar un valor.
   */
  treatment: Treatment | null;
  edition: Edition | null;
  /**
   * Fotografias de la pieza, cada una con sus variantes de formato y ancho.
   * Puede venir vacio: una pieza se registra antes de tener fotos, y el listado
   * no debe romperse por eso.
   */
  images: ObjectImage[];
  /**
   * Precio **como texto**, tal cual lo manda el servidor: `"240.00"`.
   *
   * No se convierte a `number` para mostrarlo. `Number` en JavaScript es un
   * flotante de 64 bits y no representa exactamente todos los decimales:
   * pasarlo por `Number` y volver a texto pierde los ceros significativos
   * (`"240.00"` sale como `240`) y en otros importes cambia el ultimo decimal.
   * Cuando haya que operar con el, se parsea en el momento de operar.
   *
   * `null` cuando la pieza no esta a la venta.
   */
  price: string | null;
}

/** La pieza tal como llega en el JSON, en snake_case y sin garantias. */
export interface ObjectPayload {
  number?: string | null;
  series?: string | null;
  year?: number | null;
  slug?: string;
  name?: string;
  state?: string;
  materials?: string[];
  treatment?: { kind?: string; number?: string } | null;
  edition?: { index?: number; of?: number } | null;
  images?: ImagePayload[];
  price?: string | null;
}

const STATES = new Set<string>(['available', 'archived', 'private'] satisfies ObjectState[]);

const MATERIALS = new Set<string>([
  'cotton',
  'steel',
  'leather',
  'brass',
  'griptape',
] satisfies MaterialKey[]);

/**
 * Materiales que el frontend sabe nombrar.
 *
 * Una clave desconocida se descarta en vez de emitirse: sin entrada en i18n
 * saldria a pantalla como `material.wood`, que es peor que no decir nada.
 * Agregar un material es agregar su traduccion, y este filtro es el que obliga
 * a hacerlo.
 */
function materialsFromPayload(raw: string[] | undefined): MaterialKey[] {
  return (raw ?? []).filter((key): key is MaterialKey => MATERIALS.has(key));
}

/**
 * Tratamiento, o `null` si no es uno que la ficha sepa redactar.
 *
 * Mismo criterio que los materiales: `object.treatmentThermal` es la unica
 * frase que existe, asi que un `kind` distinto no tiene como escribirse.
 */
function treatmentFromPayload(raw: ObjectPayload['treatment']): Treatment | null {
  if (!raw || raw.kind !== 'thermal' || typeof raw.number !== 'string') return null;
  return { kind: 'thermal', number: raw.number };
}

/** Edicion, o `null` si el par no es coherente (`index` dentro de `of`). */
function editionFromPayload(raw: ObjectPayload['edition']): Edition | null {
  if (!raw || typeof raw.index !== 'number' || typeof raw.of !== 'number') return null;
  if (raw.index < 1 || raw.index > raw.of) return null;
  return { index: raw.index, of: raw.of };
}

/**
 * Traduce una pieza del JSON, o `null` si el articulo no es una pieza de serie.
 *
 * El backend sirve en el mismo modelo la mercaderia corriente -- ruedas,
 * rodamientos -- que no tiene numero ni estado y llega con esos campos vacios.
 * Aqui se descarta: el archivo lista piezas identificadas, y una fila sin numero
 * ni estado no es una de ellas.
 */
export function objectFromPayload(raw: ObjectPayload): FeuoirObject | null {
  const { number, series, year, slug, name, state } = raw;

  if (!number || !series || typeof year !== 'number') return null;
  if (!slug || !name || !state || !STATES.has(state)) return null;

  return {
    number,
    series,
    year,
    slug,
    name,
    state: state as ObjectState,
    materials: materialsFromPayload(raw.materials),
    treatment: treatmentFromPayload(raw.treatment),
    edition: editionFromPayload(raw.edition),
    images: imagesFromPayload(raw.images),
    // El precio solo acompana a lo que esta a la venta. El servidor conserva el
    // importe de una pieza archivada porque es parte de su historia, pero
    // publicarlo invita a intentar comprarla, y ya no se puede.
    price: state === 'available' ? (raw.price ?? null) : null,
  };
}

/** Traduce el listado de una serie, descartando lo que no son piezas. */
export function objectsFromPayload(raw: ObjectPayload[] | null | undefined): FeuoirObject[] {
  return (raw ?? [])
    .map(objectFromPayload)
    .filter((object): object is FeuoirObject => object !== null);
}

/** Respuesta de `GET /api/products/{slug}/`, en la parte que la ficha usa. */
export interface ProductPayload {
  variants?: { id?: number; currency?: string; is_active?: boolean }[];
}

const CURRENCIES = new Set<string>(['USD', 'EUR', 'ARS'] satisfies CurrencyCode[]);

/**
 * La variante con la que se compra la pieza.
 *
 * El precio y la moneda no viven en el producto sino en la variante, y a la
 * bolsa se agrega una variante, no un producto: incluso una pieza unica tiene
 * la suya. Por eso la ficha necesita las dos cosas del mismo sitio, y salen
 * juntas -- con dos funciones podria acabar mostrando la moneda de una variante
 * y agregando otra.
 */
export interface SaleVariant {
  id: number;
  currency: CurrencyCode;
}

/**
 * La variante a la venta, o `null` si no se puede afirmar cual es.
 *
 * Se descarta la que no tiene moneda conocida y la que el servidor marca
 * inactiva. Devolver `null` y no un valor por defecto es deliberado: la ficha
 * prefiere callar el precio antes que publicar una cifra sin decir en que moneda
 * esta, y prefiere no ofrecer el boton antes que ofrecer uno que va a fallar.
 */
export function saleVariantFromProduct(payload: ProductPayload): SaleVariant | null {
  const found = (payload.variants ?? []).find(
    (variant) =>
      typeof variant.id === 'number' &&
      typeof variant.currency === 'string' &&
      CURRENCIES.has(variant.currency) &&
      variant.is_active !== false
  );

  return found ? { id: found.id as number, currency: found.currency as CurrencyCode } : null;
}

/**
 * Cuantas piezas hay en cada estado.
 *
 * Se calcula sobre la lista en vez de leerse de un contador aparte: los
 * contadores del hero y el listado del archivo son el mismo hecho, y si se
 * declaran por separado terminan discrepando.
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

/** Busca una pieza por su numero dentro de una serie ya cargada. */
export function findObject(objects: FeuoirObject[], number: string): FeuoirObject | undefined {
  return objects.find((object) => object.number === number);
}
