import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL, ApiError, apiGet } from './api';

function respondWith(body: unknown, init: ResponseInit = {}) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), init));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiGet', () => {
  it('pide la ruta contra la base configurada', async () => {
    const fetchMock = respondWith({ ok: true });

    await apiGet('/settings/');

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/settings/`, expect.anything());
    // Sin barra duplicada: Django responderia 404 en vez de la barra final.
    expect(API_BASE_URL.endsWith('/')).toBe(false);
  });

  it('devuelve el cuerpo ya parseado', async () => {
    respondWith({ hero_image: null });

    await expect(apiGet('/settings/')).resolves.toEqual({ hero_image: null });
  });

  it('convierte una respuesta de error en ApiError con su codigo', async () => {
    respondWith({ detail: 'no' }, { status: 500 });

    await expect(apiGet('/settings/')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      isNetworkFailure: false,
    });
  });

  it('distingue el servidor caido de una respuesta de error', async () => {
    // Es la diferencia entre "conteste mal" y "no conteste": con el backend
    // apagado la portada tiene que caer a su foto empaquetada, no romperse.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      })
    );

    const error = await apiGet('/settings/').catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isNetworkFailure).toBe(true);
  });

  it('propaga la cancelacion tal cual', async () => {
    // Cancelar al desmontar no es un fallo y no debe pintarse como tal.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new DOMException('The operation was aborted.', 'AbortError');
      })
    );

    const error = await apiGet('/settings/').catch((cause: unknown) => cause);

    expect(error).not.toBeInstanceOf(ApiError);
    expect((error as Error).name).toBe('AbortError');
  });
});
