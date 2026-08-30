/**
 * Traduce la foto del panel a los tokens CSS que pinta `.hero-backdrop`.
 *
 * Hermano de `ui-mode.ts` y por el mismo motivo: la apariencia se decide con
 * tokens en `<html>` y no con estilos en los componentes, asi que el JSX del
 * hero no sabe que foto se esta mostrando ni si hay alguna.
 *
 * Por que sobre `<html>` y no sobre el propio div
 * ------------------------------------------------
 * `modes.css` declara `--hero-image: var(--hero-image-src)` en el bloque del
 * modo, es decir sobre `<html>`. Las variables CSS se sustituyen en el elemento
 * donde se declaran, no donde se usan: para cuando el valor baja al div ya se
 * resolvio. Escribir `--hero-image-src` mas abajo en el arbol llegaria tarde.
 */

import type { HeroImage, HeroVideo, HeroVideoSource } from '../content/hero';

/** Cual es la foto. Lo escribe el panel; el modo decide si la usa. */
export const HERO_IMAGE_TOKEN = '--hero-image-src';

/** Encuadre de la foto, en porcentaje. */
export const HERO_POSITION_TOKEN = '--hero-position';

interface SrcsetEntry {
  url: string;
  width: number;
}

function parseSrcset(srcset: string): SrcsetEntry[] {
  return srcset
    .split(',')
    .map((entry) => entry.trim().split(/\s+/))
    .filter((parts): parts is [string, string] => parts.length === 2 && parts[1].endsWith('w'))
    .map(([url, descriptor]) => ({ url, width: Number.parseInt(descriptor, 10) }))
    .filter((entry) => Number.isFinite(entry.width))
    .sort((a, b) => a.width - b.width);
}

/**
 * El archivo mas chico que cubre `targetWidth`, o el mayor disponible.
 *
 * En un `<img>` esta eleccion la hace el navegador con `sizes`; en un fondo CSS
 * no hay `srcset` que valga -- `image-set()` no acepta descriptores de ancho --
 * asi que la hace este modulo. La ventaja de hacerla aqui es que el ancho real
 * del hero se conoce con exactitud (ocupa el viewport entero) en vez de
 * declararlo como una estimacion.
 */
export function pickSrcsetUrl(srcset: string, targetWidth: number): string | null {
  const entries = parseSrcset(srcset);
  if (entries.length === 0) return null;

  const covering = entries.find((entry) => entry.width >= targetWidth);
  // Nunca se amplia en el servidor: si el master era chico, el mayor disponible
  // es lo mejor que hay y estirarlo es trabajo del navegador.
  return (covering ?? entries[entries.length - 1]).url;
}

function layer(url: string, type?: string): string {
  const source = `url("${url}")`;
  return type ? `${source} type("${type}")` : source;
}

/**
 * Valor de `background-image` para la foto: una capa por formato disponible.
 *
 * Con `negotiatesFormat`, se emite `image-set()` con `type()` y el navegador se
 * queda con el primer formato que sabe decodificar -- AVIF pesa alrededor de un
 * 30% menos que WebP, y esta es la imagen que decide el LCP de la pagina.
 * Donde `image-set()` con `type()` no se entiende, la declaracion entera seria
 * invalida y el hero quedaria sin foto, asi que ahi se emite un `url()` a secas
 * apuntando al WebP, que soportan todos los navegadores vigentes.
 */
function backgroundImage(image: HeroImage, targetWidth: number, negotiatesFormat: boolean): string {
  const byFormat = image.sources
    .map((source) => {
      const url = pickSrcsetUrl(source.srcset, targetWidth);
      return url ? { url, type: source.type } : null;
    })
    .filter((entry): entry is { url: string; type: string } => entry !== null);

  const webp = byFormat.find((entry) => entry.type === 'image/webp');
  const fallback = webp?.url ?? image.src;

  if (!negotiatesFormat || byFormat.length < 2) return layer(fallback);

  return `image-set(${byFormat.map((entry) => layer(entry.url, entry.type)).join(', ')})`;
}

export interface HeroTokenOptions {
  /** Ancho en pixeles fisicos que ocupa el hero. */
  targetWidth: number;
  /** El navegador entiende `image-set()` con `type()`. */
  negotiatesFormat: boolean;
  /**
   * Va a haber un video encima y la foto solo hace de poster.
   *
   * Entonces se usa la misma unica URL que el atributo `poster` del `<video>`,
   * en vez de negociar formato y ancho: si las dos capas eligieran archivos
   * distintos, la portada descargaria dos veces la misma imagen. Negociar tiene
   * sentido cuando la foto ES el hero; cuando dura un instante antes de que el
   * video la tape, la economia esta en pedir un solo archivo.
   */
  asPoster: boolean;
}

/** Los tokens que describen esta foto. Funcion pura: se prueba sin navegador. */
export function heroImageTokens(image: HeroImage, options: HeroTokenOptions): Record<string, string> {
  const value = options.asPoster
    ? layer(image.src)
    : backgroundImage(image, options.targetWidth, options.negotiatesFormat);

  return {
    [HERO_IMAGE_TOKEN]: value,
    [HERO_POSITION_TOKEN]: `${image.focalPoint.x}% ${image.focalPoint.y}%`,
  };
}

/**
 * Las fuentes del ancho adecuado, en el orden en que hay que escribirlas.
 *
 * `<video>` no tiene `srcset`: se queda con la primera fuente que sabe
 * reproducir, sin mirar el tamano. Elegir el escalon por ancho de ventana es
 * entonces trabajo de este modulo, y dentro del escalon se conserva el orden de
 * la lista, que ya viene con el codec mas comprimido primero.
 *
 * En puntos CSS y no en pixeles fisicos, a diferencia de la foto: un video de
 * fondo detras de un titular se escala sin que se note, y en una pantalla de
 * densidad doble pedir 1080p en vez de 720p cuesta el doble de datos para una
 * diferencia que nadie mira.
 */
export function pickVideoSources(video: HeroVideo, targetWidth: number): HeroVideoSource[] {
  const widths = [...new Set(video.sources.map((source) => source.width))].sort((a, b) => a - b);
  const chosen = widths.find((width) => width >= targetWidth) ?? widths[widths.length - 1];
  return video.sources.filter((source) => source.width === chosen);
}

/**
 * Ancho en pixeles fisicos que ocupa el hero, que va a sangre.
 *
 * No se recalcula al redimensionar la ventana a proposito: cambiar el fondo a
 * mitad de sesion cuesta una descarga nueva a cambio de nitidez en un caso poco
 * frecuente, y la eleccion que importa es la del primer pintado.
 */
function viewportImageWidth(): number {
  return Math.round(window.innerWidth * (window.devicePixelRatio || 1));
}

function supportsFormatNegotiation(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('background-image', 'image-set(url("a.avif") type("image/avif"))')
  );
}

/** Escribe la foto en `<html>`. Lo llama el hook, no los componentes. */
export function applyHeroImage(image: HeroImage, asPoster: boolean): void {
  const tokens = heroImageTokens(image, {
    targetWidth: viewportImageWidth(),
    negotiatesFormat: supportsFormatNegotiation(),
    asPoster,
  });
  for (const [name, value] of Object.entries(tokens)) {
    document.documentElement.style.setProperty(name, value);
  }
}
