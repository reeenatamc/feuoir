/**
 * Contrato de imagen del backend, comun a la portada y al catalogo.
 *
 * El servidor devuelve el `srcset` **ya armado** -- exactamente el string que
 * espera el atributo HTML -- mas el punto focal en porcentaje. El frontend no
 * concatena anchos ni conoce la convencion de nombres de los archivos.
 *
 * Vive aparte de `hero.ts` y de `objects.ts` porque las dos vistas consumen la
 * misma forma. Con una copia en cada modulo, la primera vez que el backend
 * agregue un campo solo se enterara una de las dos.
 */

/** Punto focal en porcentaje, listo para `object-position` sin conversion. */
export interface FocalPoint {
  x: number;
  y: number;
}

/**
 * Un `<source>` del contrato: tipo MIME y `srcset` ya armado.
 *
 * El orden que llega importa y no se toca: AVIF viene primero porque el
 * navegador se queda con el primer tipo que sabe decodificar, y reordenar la
 * lista serviria el formato mas pesado a quien podia recibir el mas liviano.
 */
export interface ImageSource {
  type: string;
  srcset: string;
}

/**
 * Fotografia de una pieza, en todas sus variantes de formato y ancho.
 *
 * Las fotos NO vienen recortadas: la misma toma se muestra en `4/5`, `3/4` y
 * `1/1` segun la vista, asi que el recorte lo hace el navegador con
 * `object-fit: cover` y `focalPoint` decide que parte sobrevive.
 */
export interface ObjectImage {
  /** Descripcion. Vacia significa decorativa: es un `alt=""` valido. */
  alt: string;
  /**
   * Medidas del master. Opcionales porque el backend puede no conocerlas, y en
   * ese caso vale mas omitir los atributos que declarar un cero: `width="0"`
   * colapsa la imagen, mientras que sin atributo el navegador la mide al cargar.
   */
  width?: number;
  height?: number;
  focalPoint: FocalPoint;
  /** Respaldo en WebP a un ancho intermedio, para el `<img src>`. */
  src: string;
  sources: ImageSource[];
}

/** La imagen tal como llega en el JSON, en snake_case. */
export interface ImagePayload {
  alt?: string;
  width?: number;
  height?: number;
  focal_point?: FocalPoint;
  src?: string;
  sources?: ImageSource[];
}

/** Encuadre cuando nadie eligio uno: el mismo que aplica el navegador solo. */
const CENTER: FocalPoint = { x: 50, y: 50 };

/**
 * Traduce una imagen del JSON, o `null` si no hay nada que pintar.
 *
 * Se exige `src` porque es el unico campo sin el cual no hay imagen. Una entrada
 * incompleta tiene que comportarse igual que una entrada ausente: la retícula
 * dibuja su panel tonal, en vez de dejar el icono de imagen rota que pone el
 * navegador cuando el `src` esta vacio.
 */
export function imageFromPayload(raw: ImagePayload | null | undefined): ObjectImage | null {
  if (!raw || typeof raw.src !== 'string' || raw.src === '') return null;

  return {
    alt: raw.alt ?? '',
    width: raw.width,
    height: raw.height,
    focalPoint: raw.focal_point ?? CENTER,
    src: raw.src,
    sources: raw.sources ?? [],
  };
}

/** Traduce la lista de imagenes de una pieza, descartando las inservibles. */
export function imagesFromPayload(raw: ImagePayload[] | null | undefined): ObjectImage[] {
  return (raw ?? []).map(imageFromPayload).filter((image): image is ObjectImage => image !== null);
}
