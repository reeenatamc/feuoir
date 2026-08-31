/**
 * Cliente de la API del backend propio.
 *
 * Sin libreria de fetching: `fetch` ya resuelve lo que hace falta y una
 * dependencia mas habria que mantenerla, actualizarla y cargarla en el bundle
 * para ahorrar veinte lineas.
 *
 * Lo que si aporta este modulo es que el resto de la aplicacion no repita tres
 * decisiones en cada llamada: de donde sale la URL base, que hacer con una
 * respuesta que no es 2xx, y como se distingue "el servidor contesto mal" de
 * "el servidor no contesto". Sin esto, cada pantalla las resuelve a su manera y
 * la mitad se olvida de alguna.
 */

/**
 * Backend en desarrollo. Existe para que clonar el repo y levantar Vite
 * funcione sin configurar nada; en produccion se declara `VITE_API_URL`.
 *
 * A diferencia de las claves de Supabase, aqui un valor por defecto no es un
 * riesgo: es una direccion local, no una credencial.
 */
const DEFAULT_BASE_URL = 'http://127.0.0.1:8000/api';

function resolveBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL;
  const value =
    typeof configured === 'string' && configured.trim() !== '' ? configured.trim() : DEFAULT_BASE_URL;
  // Sin barra final: las rutas se piden como `/settings/` y dos barras seguidas
  // hacen que Django responda 404 en vez de la barra que APPEND_SLASH agrega.
  return value.replace(/\/+$/, '');
}

export const API_BASE_URL = resolveBaseUrl();

interface ApiErrorOptions extends ErrorOptions {
  detail?: string | null;
}

/**
 * Fallo de una llamada a la API, con el codigo HTTP cuando lo hubo.
 *
 * `status: 0` significa que la peticion no llego a completarse -- servidor
 * caido, sin red, CORS mal configurado -- y no que el servidor devolviera cero.
 * Es la distincion que permite decidir si reintentar tiene sentido.
 */
export class ApiError extends Error {
  readonly status: number;

  /**
   * El motivo concreto, tal como lo redacto el servidor.
   *
   * No sustituye al mensaje de la interfaz: ese sale de i18n y se muestra en el
   * idioma activo. Este acompaña, porque hay rechazos que solo el backend sabe
   * explicar -- que variante no esta a la venta, que documento esta mal
   * formado -- y perderlos deja a quien compra sin saber que corregir.
   *
   * `null` cuando el servidor no contesto, o cuando contesto algo que no era
   * JSON (una traza de error de Django, por ejemplo).
   */
  readonly detail: string | null;

  constructor(message: string, status: number, options: ApiErrorOptions = {}) {
    super(message, options);
    this.name = 'ApiError';
    this.status = status;
    this.detail = options.detail ?? null;
  }

  /** `true` cuando el servidor nunca respondio. */
  get isNetworkFailure(): boolean {
    return this.status === 0;
  }
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/**
 * El primer mensaje legible de un cuerpo de error.
 *
 * El contrato documenta dos formas y las dos hay que saber leer: `{"detail":
 * "..."}` para los rechazos de negocio y `{"campo": {"sub": ["..."]}}` para los
 * de validacion. Se busca `detail` antes que el resto para que un cuerpo con
 * varias claves no devuelva la de al lado.
 */
function firstMessage(body: unknown): string | null {
  if (typeof body === 'string') return body.trim() || null;

  if (Array.isArray(body)) {
    for (const entry of body) {
      const message = firstMessage(entry);
      if (message) return message;
    }
    return null;
  }

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;

    if ('detail' in record) {
      const message = firstMessage(record.detail);
      if (message) return message;
    }

    for (const value of Object.values(record)) {
      const message = firstMessage(value);
      if (message) return message;
    }
  }

  return null;
}

async function readDetail(response: Response): Promise<string | null> {
  try {
    return firstMessage(await response.json());
  } catch {
    // Un 500 de Django en desarrollo llega como HTML, y un 502 de un proxy
    // tampoco es JSON. No poder leer el motivo no es motivo para romper.
    return null;
  }
}

/** El viaje en si. Lo comparten la lectura y la escritura. */
async function request<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch (cause) {
    // Cancelar una peticion no es un fallo: se propaga tal cual para que quien
    // llama pueda ignorarla en vez de pintar un error que nadie pidio.
    if (isAbort(cause)) throw cause;
    throw new ApiError(`No se pudo contactar la API en ${API_BASE_URL}.`, 0, { cause });
  }

  if (!response.ok) {
    throw new ApiError(`${path} respondio ${response.status}.`, response.status, {
      detail: await readDetail(response),
    });
  }

  return (await response.json()) as T;
}

/** Lectura de un recurso JSON. `path` empieza con barra: `/settings/`. */
export function apiGet<T>(path: string, init: RequestInit = {}): Promise<T> {
  return request<T>(path, {
    ...init,
    headers: { Accept: 'application/json', ...init.headers },
  });
}

/** Metodos que modifican. `PUT` no lo usa ningun endpoint del contrato. */
export type ApiMethod = 'POST' | 'PATCH' | 'DELETE';

export interface SendOptions {
  /** Cuerpo JSON. Se omite el `Content-Type` cuando no hay nada que mandar. */
  body?: unknown;
  /** Cabeceras propias del recurso, como el token de carrito. */
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Escritura. Devuelve el cuerpo de la respuesta ya parseado.
 *
 * Todos los endpoints que esta aplicacion escribe contestan con el recurso
 * actualizado, asi que no hay caso `204` que contemplar: agregarlo seria escribir
 * una rama que ninguna llamada recorre.
 */
export function apiSend<T>(method: ApiMethod, path: string, options: SendOptions = {}): Promise<T> {
  const { body, headers, signal } = options;

  return request<T>(path, {
    method,
    signal,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
