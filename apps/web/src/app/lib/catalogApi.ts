import { findObject, objectsFromPayload, saleVariantFromProduct } from '../content/objects';
import type { FeuoirObject, ObjectPayload, ProductPayload, SaleVariant } from '../content/objects';
import { seriesFromPayload } from '../content/series';
import type { SeriesMeta, SeriesPayload } from '../content/series';
import { apiGet } from './api';

/**
 * Las peticiones del catalogo, separadas de los hooks que las usan.
 *
 * El motivo es que se puedan probar. Un hook necesita un arbol de React montado
 * para correr; estas funciones son `async` puras sobre `fetch`, asi que el caso
 * que mas importa -- que el servidor no conteste -- se comprueba en la suite
 * unitaria y no solo mirando la pagina.
 */

/** La serie vigente y sus piezas, que siempre se piden juntas. */
export interface SeriesCatalog {
  series: SeriesMeta;
  objects: FeuoirObject[];
}

/**
 * Trae la serie vigente y las piezas que la componen.
 *
 * Son dos viajes y no uno porque el segundo depende del primero: el numero de
 * serie sale de `current`, y sin el no hay ruta que pedir. La alternativa seria
 * escribir `001` en el codigo, que es exactamente el dato que este endpoint
 * existe para no fijar.
 */
export async function loadSeriesCatalog(signal?: AbortSignal): Promise<SeriesCatalog> {
  const payload = await apiGet<SeriesPayload>('/series/current/', { signal });
  const pieces = await apiGet<ObjectPayload[]>(`/series/${payload.number}/objects/`, { signal });
  const objects = objectsFromPayload(pieces);

  return { series: seriesFromPayload(payload, objects), objects };
}

/** Una pieza concreta, con la variante a la venta cuando la tiene. */
export interface ObjectRecord {
  /** `null` si la serie vigente no tiene ninguna pieza con ese numero. */
  object: FeuoirObject | null;
  /**
   * De donde salen la moneda del precio y el identificador con el que se agrega
   * la pieza a la bolsa. `null` cuando la pieza no esta a la venta o el producto
   * no se pudo consultar.
   */
  variant: SaleVariant | null;
}

/**
 * La variante a la venta de una pieza, pedida por su slug.
 *
 * Un fallo aqui no tumba la ficha: devuelve `null` y la ficha se dibuja entera
 * menos el precio y el boton de comprar. Ocultar una cifra es una degradacion
 * aceptable; publicarla sin decir en que moneda esta, no -- y ofrecer un boton
 * que no sabe que variante agregar, tampoco.
 */
async function loadSaleVariant(slug: string, signal?: AbortSignal): Promise<SaleVariant | null> {
  try {
    return saleVariantFromProduct(await apiGet<ProductPayload>(`/products/${slug}/`, { signal }));
  } catch (cause) {
    console.error('[api] variante de la pieza:', cause);
    return null;
  }
}

/**
 * Trae la pieza que corresponde a un numero de la serie vigente.
 *
 * La URL de la ficha lleva el numero porque serie + numero es la identidad de la
 * pieza, la que va impresa en la etiqueta. La API, en cambio, direcciona los
 * productos por slug: el listado de la serie es lo que traduce una cosa en la
 * otra, y por eso la ficha pasa por el mismo endpoint que el archivo.
 *
 * El tercer viaje solo ocurre si hay precio que mostrar. Una pieza archivada o
 * un encargo privado no lo tienen, y buscarles la variante seria pedir un dato
 * para descartarlo.
 */
export async function loadObjectRecord(
  number: string,
  signal?: AbortSignal
): Promise<ObjectRecord> {
  const { objects } = await loadSeriesCatalog(signal);
  const object = findObject(objects, number) ?? null;
  const variant = object?.price ? await loadSaleVariant(object.slug, signal) : null;

  return { object, variant };
}
