/**
 * Fotografia a sangre de la portada.
 *
 * Como el resto de los modulos de contenido, la forma declarada aqui es la que
 * devuelve la API (`GET /api/settings/`), no una inventada que despues haya que
 * traducir. La diferencia con `objects.ts` o `series.ts` es que esta ya se
 * alimenta del backend: lo que queda escrito a mano es solo el respaldo.
 */

/** Punto focal en porcentaje, tal como lo consume `background-position`. */
export interface FocalPoint {
  x: number;
  y: number;
}

/** Un `<source>` del contrato de imagen: tipo MIME y `srcset` ya armado. */
export interface ImageSource {
  type: string;
  srcset: string;
}

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
  focalPoint: { x: 50, y: 50 },
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
 * Las dos condiciones en una sola consulta, porque son la misma decision: el
 * video de fondo se reproduce si aporta algo y nadie pidio lo contrario.
 *
 * El corte por ancho no es "movil vs escritorio" por el dispositivo, es por lo
 * que queda del video. La toma es de 1,94:1 y el hero recorta con `cover`: en
 * una pantalla de telefono en vertical se ve menos de un cuarto del ancho del
 * cuadro, con lo que la composicion desaparece y el movimiento se vuelve ruido
 * -- pagado con datos moviles y bateria en un bucle infinito. La foto sufre el
 * mismo recorte, pero un recorte de una foto sigue siendo una foto.
 */
export const HERO_MOTION_QUERY = '(min-width: 768px) and (prefers-reduced-motion: no-preference)';

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
 * Traduce la foto del ajuste, o `null` si no hay ninguna utilizable.
 *
 * Devolver `null` y no un objeto a medias es lo que permite que quien llama
 * decida caer al respaldo con una sola linea. Se comprueba `src` porque es el
 * unico campo sin el cual no hay nada que pintar: un ajuste incompleto tiene
 * que comportarse igual que un ajuste vacio, no dejar la portada en negro.
 */
export function heroImageFromSettings(payload: StoreSettingsPayload): HeroImage | null {
  const raw = payload.hero_image;
  if (!raw || typeof raw.src !== 'string' || raw.src === '') return null;

  return {
    alt: raw.alt ?? '',
    focalPoint: raw.focal_point ?? BUNDLED_HERO_IMAGE.focalPoint,
    src: raw.src,
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
