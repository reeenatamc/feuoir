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

/**
 * Fallo de una llamada a la API, con el codigo HTTP cuando lo hubo.
 *
 * `status: 0` significa que la peticion no llego a completarse -- servidor
 * caido, sin red, CORS mal configurado -- y no que el servidor devolviera cero.
 * Es la distincion que permite decidir si reintentar tiene sentido.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiError';
    this.status = status;
  }

  /** `true` cuando el servidor nunca respondio. */
  get isNetworkFailure(): boolean {
    return this.status === 0;
  }
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/** Lectura de un recurso JSON. `path` empieza con barra: `/settings/`. */
export async function apiGet<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...init.headers },
    });
  } catch (cause) {
    // Cancelar una peticion no es un fallo: se propaga tal cual para que quien
    // llama pueda ignorarla en vez de pintar un error que nadie pidio.
    if (isAbort(cause)) throw cause;
    throw new ApiError(`No se pudo contactar la API en ${API_BASE_URL}.`, 0, { cause });
  }

  if (!response.ok) {
    throw new ApiError(`${path} respondio ${response.status}.`, response.status);
  }

  return (await response.json()) as T;
}
