import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearCartToken, readCartToken, storeCartToken } from './cartToken';

/** Un almacen en memoria, que es lo que hace `localStorage` cuando funciona. */
function workingStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  });

  return data;
}

/**
 * Un `localStorage` que tira en cada acceso.
 *
 * No es un caso teorico: Safari en modo privado y un navegador con las cookies
 * bloqueadas se comportan asi. Antes de que el proyecto adoptara el resguardo,
 * un throw a nivel de modulo tumbaba el arranque de toda la aplicacion.
 */
function throwingStorage() {
  const boom = () => {
    throw new DOMException('The operation is insecure.', 'SecurityError');
  };

  vi.stubGlobal('localStorage', { getItem: boom, setItem: boom, removeItem: boom });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('el token del carrito', () => {
  it('sobrevive entre visitas, que es para lo que se guarda', () => {
    // `localStorage` y no `sessionStorage`: una bolsa abandonada el martes tiene
    // que seguir ahi el miercoles, que es cuando se vuelve a decidir la compra.
    workingStorage();

    storeCartToken('FGBbStmAwN4jvVDrjg-dc83qbo1xNfkQRWU6EYLu0V4');

    expect(readCartToken()).toBe('FGBbStmAwN4jvVDrjg-dc83qbo1xNfkQRWU6EYLu0V4');
  });

  it('sin nada guardado devuelve null, que es "no hay bolsa abierta"', () => {
    workingStorage();

    expect(readCartToken()).toBeNull();
  });

  it('trata una cadena vacia como si no hubiera token', () => {
    // Mandarla en la cabecera daria un 404 en cada peticion, para siempre.
    workingStorage({ feuoir_cart_token: '' });

    expect(readCartToken()).toBeNull();
  });

  it('el borrado deja la bolsa sin token', () => {
    // Es lo que se ejecuta despues de un checkout: el servidor consume el
    // carrito, y sin este borrado el siguiente GET /api/cart/ daria 404 siempre.
    const data = workingStorage({ feuoir_cart_token: 'k' });

    clearCartToken();

    expect(data.has('feuoir_cart_token')).toBe(false);
    expect(readCartToken()).toBeNull();
  });

  it('en navegacion privada no rompe: no hay token, hay sitio', () => {
    throwingStorage();

    expect(() => storeCartToken('k')).not.toThrow();
    expect(() => clearCartToken()).not.toThrow();
    expect(readCartToken()).toBeNull();
  });

  it('fuera del navegador tampoco rompe', () => {
    // No hay `localStorage` en absoluto: el acceso opcional devuelve undefined.
    vi.stubGlobal('localStorage', undefined);

    expect(readCartToken()).toBeNull();
    expect(() => storeCartToken('k')).not.toThrow();
  });
});
