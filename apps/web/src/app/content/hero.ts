/**
 * Fotografia a sangre de la portada.
 *
 * Como el resto de los modulos de contenido, la forma declarada aqui es la que
 * devuelve la API (`GET /api/settings/`), no una inventada que despues haya que
 * traducir. Lo unico escrito a mano es el respaldo empaquetado, porque la
 * portada no puede quedarse sin fondo esperando a un servidor.
 */

import type { FocalPoint, ImageSource } from './images';

export interface HeroImage {
  /**
   * Descripcion de la foto. Vacia significa decorativa, y entonces la portada
   * la oculta a los lectores de pantalla en vez de anunciar una imagen sin
   * nombre delante del titular.
   */
  alt: string;
  /** Que parte de la foto sobrevive al recorte en una pantalla angosta. */
  focalPoint: FocalPoint;
  /** Respaldo en WebP, ancho intermedio. Lo soportan todos los navegadores. */
  src: string;
  /** Variantes por formato y ancho. Vacio en la foto empaquetada. */
  sources: ImageSource[];
}

/**
 * La foto que viaja en el bundle.
 *
 * Es el respaldo de todo lo que puede salir mal antes de tener una foto del
 * panel: backend caido, red lenta, tienda recien instalada sin nada cargado.
 * La portada nunca se queda sin fondo, y ademas es el valor por defecto del
 * token CSS, asi que se pinta aunque el JavaScript no llegue a correr.
 *
 * Es el primer fotograma del video empaquetado, no una foto aparte: asi el
 * momento en que el video arranca no es un corte a otra imagen.
 */
export const BUNDLED_HERO_IMAGE: HeroImage = {
  alt: '',
  /**
   * A la izquierda del centro, y no en el centro, porque el encuadre movil se
   * decide aqui. La banda deja ver el 60% del ancho del cuadro; anclada al 50%
   * ese recorte empieza en el 20% y se lleva por delante a la mujer, que ocupa
   * del 11% al 35%. Al 40% empieza en el 16%: entran ella y las llamas, que
   * terminan en el 78%. En escritorio se ve el 86% del cuadro y mover el ancla
   * un 10% no cambia nada.
   * Vale para la foto empaquetada, que es esta y se conoce. La foto del panel
   * trae su propio punto focal y manda el suyo.
   */
  focalPoint: { x: 40, y: 50 },
  src: '/hero-poster.webp',
  sources: [
    { type: 'image/avif', srcset: '/hero-poster.avif 1920w' },
    { type: 'image/webp', srcset: '/hero-poster.webp 1920w' },
  ],
};

/** Una fuente de video: lo que hace falta para escribir un `<source>`. */
export interface HeroVideoSource {
  /** Tipo MIME con el codec completo. Sin el, el orden de fuentes no sirve. */
  type: string;
  src: string;
  /** Ancho del archivo, para no bajar 1080p a una ventana de 900. */
  width: number;
}

export interface HeroVideo {
  sources: HeroVideoSource[];
}

/**
 * El video que viaja en el bundle, en dos codecs y dos tamanos.
 *
 * AV1 antes que H.264 porque el navegador se queda con la primera fuente que
 * sabe reproducir, y AV1 pesa alrededor de un 40% menos. Las de 1280 no son un
 * respaldo sino la eleccion correcta para una ventana angosta: bajar 1080p a
 * una ventana de 900 puntos es gastar el doble para el mismo resultado.
 */
export const BUNDLED_HERO_VIDEO: HeroVideo = {
  sources: [
    { type: 'video/mp4; codecs="av01.0.05M.08"', src: '/hero-sm.av1.mp4', width: 1280 },
    { type: 'video/mp4; codecs="avc1.64001f"', src: '/hero-sm.mp4', width: 1280 },
    { type: 'video/mp4; codecs="av01.0.08M.08"', src: '/hero.av1.mp4', width: 1920 },
    { type: 'video/mp4; codecs="avc1.640032"', src: '/hero.mp4', width: 1920 },
  ],
};

/**
 * Cuando el hero se mueve.
 *
 * Queda una sola condicion, y es la unica que no depende del diseño: que nadie
 * haya pedido menos movimiento. Un bucle a pantalla completa que nadie pidio es
 * exactamente lo que esa preferencia existe para evitar.
 *
 * Hubo un corte por ancho que excluia al telefono, y su motivo era el recorte:
 * la toma es de 1,94:1 y el hero la recortaba con `cover` contra una ventana en
 * vertical, con lo que se veia menos de un cuarto del cuadro y el movimiento
 * dejaba de ser la escena para volverse ruido pagado con datos y bateria.
 * Ese recorte ya no existe: en movil la foto es una banda con proporcion propia
 * (`--hero-band-ratio` en modes.css) donde sobrevive el 60% del cuadro sin
 * ampliar nada. Sin el recorte se cae el argumento, y el video vuelve.
 *
 * El peso se acota donde corresponde: `pickVideoSources` elige el escalon por
 * ancho de ventana, asi que a un telefono le tocan las variantes chicas.
 */
export const HERO_MOTION_QUERY = '(prefers-reduced-motion: no-preference)';

/** La foto tal como llega en el JSON, en snake_case. */
interface HeroImagePayload {
  alt?: string;
  focal_point?: FocalPoint;
  src?: string;
  sources?: ImageSource[];
}

/** Respuesta de `GET /api/settings/`, en la parte que la portada usa. */
export interface StoreSettingsPayload {
  hero_image: HeroImagePayload | null;
  hero_video?: { sources?: HeroVideoSource[] } | null;
}

/**
 * Esquemas admitidos para la foto.
 *
 * `http:` entra ademas de `https:` porque en desarrollo la API devuelve las
 * URLs absolutas contra `http://127.0.0.1:8000` y dejarlo fuera apagaria la
 * foto en la maquina de quien la desarrolla. No afloja nada: el esquema nunca
 * fue el vector -- lo eran los caracteres que cierran el `url("...")` donde
 * esta cadena termina, y de esos se ocupa la comprobacion de abajo.
 */
const ALLOWED_IMAGE_PROTOCOLS = ['http:', 'https:'];

/**
 * Caracteres que ninguna URL puede traer en claro y que si romperian el CSS.
 *
 * Las comillas y los parentesis cierran el `url("...")`, la barra invertida
 * escapa lo que sigue, y un salto de linea termina la declaracion. Una URL de
 * verdad los lleva codificados (`%22`, `%28`), asi que rechazarlos no deja
 * fuera ningun archivo real.
 */
const CSS_BREAKING = /["'()\\\s]/;

/** `src` utilizable, o `null` si no hay forma segura de pintarlo. */
function usableSrc(value: unknown): string | null {
  if (typeof value !== 'string' || value === '' || CSS_BREAKING.test(value)) return null;
  // `//host/x.webp` parece una ruta y es una URL absoluta con el esquema del
  // documento. Se descarta antes de tratar la barra inicial como "del sitio".
  if (value.startsWith('//')) return null;
  if (value.startsWith('/')) return value;

  try {
    return ALLOWED_IMAGE_PROTOCOLS.includes(new URL(value).protocol) ? value : null;
  } catch {
    return null;
  }
}

/** Porcentaje del punto focal, o `null` si no es un numero del 0 al 100. */
function usablePercentage(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
}

/**
 * Punto focal del ajuste, o el del respaldo.
 *
 * `focal_point` se tomaba sin mirarle el tipo y terminaba interpolado tal cual
 * en la declaracion `--hero-position`. Pasarlo por `Number()` garantiza que lo
 * que se escribe en el CSS es un numero y no lo que haya mandado el servidor.
 */
function usableFocalPoint(value: unknown): FocalPoint {
  const raw = value as { x?: unknown; y?: unknown } | null | undefined;
  const x = usablePercentage(raw?.x);
  const y = usablePercentage(raw?.y);
  return x === null || y === null ? BUNDLED_HERO_IMAGE.focalPoint : { x, y };
}

/**
 * Traduce la foto del ajuste, o `null` si no hay ninguna utilizable.
 *
 * Devolver `null` y no un objeto a medias es lo que permite que quien llama
 * decida caer al respaldo con una sola linea. Se comprueba `src` porque es el
 * unico campo sin el cual no hay nada que pintar: un ajuste incompleto tiene
 * que comportarse igual que un ajuste vacio, no dejar la portada en negro.
 *
 * Ademas de "hay algo", se comprueba "esto es pintable". Lo que llega aca es
 * texto de la API y termina dentro de una declaracion CSS: un `src` con `")`
 * cierra el `url("...")` y lo que sigue se lee como reglas nuevas sobre
 * `<html>`. Filtrar en la traduccion y no en el modulo que pinta deja una sola
 * puerta de entrada, que es donde se puede vigilar.
 */
export function heroImageFromSettings(payload: StoreSettingsPayload): HeroImage | null {
  const raw = payload.hero_image;
  const src = usableSrc(raw?.src);
  if (!raw || src === null) return null;

  return {
    alt: raw.alt ?? '',
    focalPoint: usableFocalPoint(raw.focal_point),
    src,
    sources: raw.sources ?? [],
  };
}

/**
 * Traduce el video del ajuste, o `null` si no hay ninguno reproducible.
 *
 * Una fuente sin `type` se descarta en vez de emitirse a medias: sin el codec
 * declarado, un navegador que no soporte ese formato contesta que si puede,
 * descarga el archivo entero y falla al decodificarlo, sin llegar nunca a la
 * fuente siguiente.
 */
export function heroVideoFromSettings(payload: StoreSettingsPayload): HeroVideo | null {
  const sources = (payload.hero_video?.sources ?? []).filter(
    (source) => typeof source?.src === 'string' && typeof source?.type === 'string'
  );
  return sources.length > 0 ? { sources } : null;
}
