/**
 * Modos de interfaz. Cada modo es un juego de tokens CSS en `styles/modes.css`,
 * no una copia de los componentes: el arbol de React es el mismo en los dos.
 *
 * Regla para mantenerlo asi:
 *   - diferencia de APARIENCIA (color, tipografia, radios, sombras, duracion)
 *     -> token nuevo en modes.css, el componente no se entera.
 *   - diferencia de ESTRUCTURA (un elemento que solo existe en un modo)
 *     -> `useUiMode()` en el componente y render condicional de ESE elemento.
 *
 * Duplicar un componente entero por modo no entra en ninguno de los dos casos.
 */
export const UI_MODES = ['cool', 'bored'] as const;

export type UiMode = (typeof UI_MODES)[number];

/**
 * `cool` es el modo por defecto: es la cara que el negocio quiere mostrar.
 * `bored` es la interfaz sobria, disponible para quien la prefiera.
 */
export const DEFAULT_UI_MODE: UiMode = 'cool';

/** Atributo en <html> del que cuelgan los tokens de cada modo. */
export const UI_MODE_ATTRIBUTE = 'data-ui-mode';

const STORAGE_KEY = 'feuoir_ui_mode';

function isUiMode(value: unknown): value is UiMode {
  return UI_MODES.includes(value as UiMode);
}

// Mismo criterio que `i18n/config.ts`: localStorage puede tirar (Safari en modo
// privado, cookies bloqueadas) y no existe fuera del navegador, asi que nunca se
// accede sin try/catch.
export function readStoredUiMode(): UiMode {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    return isUiMode(stored) ? stored : DEFAULT_UI_MODE;
  } catch {
    return DEFAULT_UI_MODE;
  }
}

export function storeUiMode(mode: UiMode): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, mode);
  } catch {
    // Persistir la preferencia es best-effort; no vale romper la app por esto.
  }
}

export function applyUiMode(mode: UiMode): void {
  document.documentElement.setAttribute(UI_MODE_ATTRIBUTE, mode);
}

/**
 * Se llama desde `main.tsx` antes del primer render. El provider tambien aplica
 * el modo, pero recien en su efecto (post-paint): sin esto el primer frame sale
 * con los tokens del modo equivocado y se ve el parpadeo.
 */
export function applyStoredUiMode(): void {
  applyUiMode(readStoredUiMode());
}

/** El modo al que lleva el toggle desde `mode`. */
export function oppositeUiMode(mode: UiMode): UiMode {
  return mode === 'cool' ? 'bored' : 'cool';
}

/**
 * Si el hero de este modo lleva fondo a sangre: foto y, encima, video.
 *
 * Esta linea es la unica duplicacion que tiene el sistema de modos, y es
 * deliberada. `modes.css` ya expresa lo mismo con `--hero-image: none` en el
 * modo sobrio, pero un token CSS no puede impedir que se monte un elemento, y
 * un `<video autoplay>` escondido con `display: none` se descarga igual. La
 * decision de apariencia vive en el CSS; esta funcion existe solo para no
 * bajarse un video que ese modo no va a mostrar.
 *
 * Al agregar un modo hay que tocar los dos sitios. Estan referenciados entre si
 * para que quien toque uno encuentre el otro.
 */
export function usesHeroMedia(mode: UiMode): boolean {
  return mode === 'cool';
}
