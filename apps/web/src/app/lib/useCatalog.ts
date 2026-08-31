import { useEffect, useState } from 'react';
import type { FeuoirObject, SaleVariant } from '../content/objects';
import type { SeriesMeta } from '../content/series';
import { loadObjectRecord, loadSeriesCatalog } from './catalogApi';

/**
 * El catalogo tal como lo consumen las vistas.
 *
 * Mismo reparto que `useHeroBackground`: el hook trae los datos y expone en que
 * punto esta, y el componente decide que dibujar en cada caso. La diferencia es
 * que aqui no hay respaldo empaquetado -- una serie no se puede inventar -- asi
 * que `loading` y `error` no se ven igual y las dos tienen que decir algo.
 */

/**
 * `empty` es la serie que cargo bien y no tiene ninguna pieza.
 *
 * Es un estado aparte y no un `ready` con la lista vacia porque la pagina tiene
 * que decir algo distinto en cada caso, y con un solo `ready` cada vista
 * repetiria por su cuenta la comprobacion de la longitud. Que sea un estado
 * hace que la vista se resuelva en una linea y que ninguna se olvide.
 */
export type CatalogStatus = 'loading' | 'ready' | 'empty' | 'error';

export interface SeriesCatalogState {
  status: CatalogStatus;
  /** `null` mientras carga y si fallo: la serie no se puede suponer. */
  series: SeriesMeta | null;
  objects: FeuoirObject[];
  /** Mensaje del fallo, para diagnosticar. `null` mientras no lo haya. */
  error: string | null;
}

const INITIAL: SeriesCatalogState = {
  status: 'loading',
  series: null,
  objects: [],
  error: null,
};

/** Texto del fallo, sin asumir que lo que se atrapo era un `Error`. */
function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

/**
 * Trae la serie vigente con sus piezas.
 *
 * Lo usan la portada, la seccion de la home, la pagina de objetos y el archivo:
 * las cuatro muestran la misma serie, y con una consulta por vista los
 * contadores de una podrian no coincidir con la lista de la otra.
 */
export function useCurrentSeries(): SeriesCatalogState {
  const [state, setState] = useState<SeriesCatalogState>(INITIAL);

  useEffect(() => {
    // La peticion puede volver despues de que el usuario navegue a otra pagina.
    // `active` evita escribir estado sobre un componente ya desmontado, y el
    // controlador ademas cancela la descarga en vez de dejarla terminar sola.
    let active = true;
    const controller = new AbortController();

    loadSeriesCatalog(controller.signal)
      .then(({ series, objects }) => {
        if (!active) return;
        setState({
          status: objects.length > 0 ? 'ready' : 'empty',
          series,
          objects,
          error: null,
        });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        console.error('[api] serie vigente:', cause);
        setState({ ...INITIAL, status: 'error', error: describe(cause) });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return state;
}

export interface ObjectRecordState {
  status: 'loading' | 'ready' | 'error';
  /**
   * La pieza, o `null` si la serie no tiene ninguna con ese numero. Con
   * `status` en `ready`, ese `null` es la respuesta -- no existe -- y no una
   * carga a medias: la ficha muestra su aviso en vez de una pagina en blanco.
   */
  object: FeuoirObject | null;
  /**
   * Variante a la venta: de ahi salen la moneda del precio y el identificador
   * con el que la pieza entra en la bolsa. `null` cuando no esta a la venta.
   */
  variant: SaleVariant | null;
  error: string | null;
}

const INITIAL_RECORD: ObjectRecordState = {
  status: 'loading',
  object: null,
  variant: null,
  error: null,
};

/** Trae la pieza de la ficha a partir del numero que lleva la URL. */
export function useObjectRecord(number: string | undefined): ObjectRecordState {
  const [state, setState] = useState<ObjectRecordState>(INITIAL_RECORD);

  useEffect(() => {
    // Sin numero en la URL no hay nada que pedir, y es el mismo desenlace que un
    // numero que no existe: la ficha avisa y ofrece volver a la serie.
    if (!number) {
      setState({ ...INITIAL_RECORD, status: 'ready' });
      return;
    }

    let active = true;
    const controller = new AbortController();

    loadObjectRecord(number, controller.signal)
      .then(({ object, variant }) => {
        if (!active) return;
        setState({ status: 'ready', object, variant, error: null });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        console.error('[api] ficha de pieza:', cause);
        setState({ ...INITIAL_RECORD, status: 'error', error: describe(cause) });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [number]);

  return state;
}
