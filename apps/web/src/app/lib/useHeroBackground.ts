import { useEffect, useState } from 'react';
import {
  BUNDLED_HERO_IMAGE,
  BUNDLED_HERO_VIDEO,
  heroImageFromSettings,
  heroVideoFromSettings,
} from '../content/hero';
import type { HeroImage, HeroVideo, StoreSettingsPayload } from '../content/hero';
import { applyHeroImage } from '../theme/hero-image';
import { apiGet } from './api';

/**
 * Estado del fondo de la portada.
 *
 * `image` nunca falta, ni siquiera mientras se carga o cuando la peticion
 * fallo: el valor por defecto es la foto empaquetada. Esa es la razon de que el
 * estado tenga esta forma y no `HeroImage | undefined` -- la portada no puede
 * quedarse sin fondo esperando a un servidor, y con un opcional el primer
 * consumidor que se olvide del caso deja un hueco negro a pantalla completa.
 *
 * `video` si puede faltar, porque su ausencia es un estado legitimo y no una
 * falta de datos: un fondo quieto es una portada valida.
 */
export interface HeroBackgroundState {
  status: 'loading' | 'ready' | 'error';
  image: HeroImage;
  video: HeroVideo | null;
  /** Mensaje del fallo, para diagnosticar. `null` mientras no lo haya. */
  error: string | null;
}

const INITIAL: HeroBackgroundState = {
  status: 'loading',
  image: BUNDLED_HERO_IMAGE,
  video: BUNDLED_HERO_VIDEO,
  error: null,
};

/**
 * Trae el fondo configurado en el panel y aplica la foto como tokens del hero.
 *
 * La portada solo consume `image` y `video`, porque cargando y fallando se ven
 * igual: en los dos casos se muestra lo empaquetado, que es exactamente el
 * comportamiento que se quiere. `status` y `error` estan de todos modos porque
 * un fallo silencioso es indistinguible de una tienda sin nada cargado, y esa
 * diferencia importa cuando algo no anda.
 *
 * @param playsVideo si el hero va a montar el `<video>`. Cambia como se pide la
 *   foto: de poster basta una sola URL, y negociar formato y ancho descargaria
 *   un archivo distinto del que ya pide el atributo `poster`.
 */
export function useHeroBackground(playsVideo: boolean): HeroBackgroundState {
  const [state, setState] = useState<HeroBackgroundState>(INITIAL);

  useEffect(() => {
    // La peticion puede volver despues de que el usuario navegue a otra pagina.
    // `active` evita escribir estado sobre un componente ya desmontado, y el
    // controlador ademas cancela la descarga en vez de dejarla terminar sola.
    let active = true;
    const controller = new AbortController();

    apiGet<StoreSettingsPayload>('/settings/', { signal: controller.signal })
      .then((settings) => {
        if (!active) return;
        const image = heroImageFromSettings(settings);
        setState({
          status: 'ready',
          // Sin foto configurada no se hereda el video empaquetado: seria el
          // fondo de una portada que ya nadie eligio.
          image: image ?? BUNDLED_HERO_IMAGE,
          video: image ? heroVideoFromSettings(settings) : BUNDLED_HERO_VIDEO,
          error: null,
        });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const error = cause instanceof Error ? cause.message : String(cause);
        console.error('[api] settings:', cause);
        setState({ ...INITIAL, status: 'error', error });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    applyHeroImage(state.image, playsVideo && state.video !== null);
  }, [state.image, state.video, playsVideo]);

  return state;
}
