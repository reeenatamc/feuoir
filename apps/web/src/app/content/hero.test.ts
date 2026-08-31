import { describe, expect, it } from 'vitest';
import { BUNDLED_HERO_IMAGE, heroImageFromSettings, heroVideoFromSettings } from './hero';

describe('heroImageFromSettings', () => {
  it('traduce la foto del ajuste a la forma que usa la portada', () => {
    const image = heroImageFromSettings({
      hero_image: {
        alt: 'Coche en llamas',
        focal_point: { x: 62, y: 38 },
        src: 'https://cdn/960.webp',
        sources: [{ type: 'image/webp', srcset: 'https://cdn/960.webp 960w' }],
      },
    });

    expect(image).toEqual({
      alt: 'Coche en llamas',
      focalPoint: { x: 62, y: 38 },
      src: 'https://cdn/960.webp',
      sources: [{ type: 'image/webp', srcset: 'https://cdn/960.webp 960w' }],
    });
  });

  it('devuelve null cuando la tienda no cargo ninguna', () => {
    // Caso de una instalacion recien hecha: no es un error, es el estado inicial.
    expect(heroImageFromSettings({ hero_image: null })).toBeNull();
  });

  it('devuelve null si el ajuste llega a medias', () => {
    // Un ajuste incompleto tiene que comportarse como uno vacio y caer al
    // respaldo, no producir un `url("undefined")` que deja la portada en negro.
    expect(heroImageFromSettings({ hero_image: { alt: 'x' } })).toBeNull();
    expect(heroImageFromSettings({ hero_image: { src: '' } })).toBeNull();
  });

  it('una foto sin descripcion es decorativa, no una foto rota', () => {
    const image = heroImageFromSettings({ hero_image: { src: 'https://cdn/960.webp' } });

    expect(image?.alt).toBe('');
    expect(image?.focalPoint).toEqual(BUNDLED_HERO_IMAGE.focalPoint);
  });
});

describe('heroImageFromSettings frente a un ajuste hostil', () => {
  // Estos tests existen por un hallazgo concreto: `src` se comprobaba solo con
  // `typeof === 'string'` y terminaba interpolado dentro de `url("...")` en una
  // declaracion CSS. Un `")` cierra la funcion y lo que sigue son reglas nuevas
  // sobre `<html>`. `focal_point` era peor: no se le miraba ni el tipo.

  it('descarta un src que cierra el url() del CSS', () => {
    const image = heroImageFromSettings({
      hero_image: { src: 'https://cdn/a.webp") ;background:url("https://evil/x.png' },
    });

    expect(image).toBeNull();
  });

  it('descarta esquemas que no sean http ni https', () => {
    expect(heroImageFromSettings({ hero_image: { src: 'javascript:alert(1)' } })).toBeNull();
    expect(heroImageFromSettings({ hero_image: { src: 'data:image/svg+xml,<svg/>' } })).toBeNull();
    expect(heroImageFromSettings({ hero_image: { src: 'no-es-una-url' } })).toBeNull();
  });

  it('descarta //host, que parece una ruta y es una URL absoluta', () => {
    expect(heroImageFromSettings({ hero_image: { src: '//evil.example/x.webp' } })).toBeNull();
  });

  it('acepta una ruta del propio sitio', () => {
    // Es la forma en que llega la foto cuando el frontend y la API comparten
    // origen, que es como se despliega en produccion.
    expect(heroImageFromSettings({ hero_image: { src: '/media/hero/960.webp' } })?.src).toBe(
      '/media/hero/960.webp'
    );
  });

  it('acepta http, que es lo que devuelve la API en desarrollo', () => {
    // Bloquearlo dejaria la portada con el respaldo empaquetado en la maquina
    // de quien la desarrolla, y eso es romper el uso normal.
    expect(heroImageFromSettings({ hero_image: { src: 'http://127.0.0.1:8000/media/x.webp' } })?.src).toBe(
      'http://127.0.0.1:8000/media/x.webp'
    );
  });

  it('convierte el punto focal a numero', () => {
    const image = heroImageFromSettings({
      hero_image: { src: '/x.webp', focal_point: { x: '62', y: '38' } as never },
    });

    expect(image?.focalPoint).toEqual({ x: 62, y: 38 });
  });

  it('cae al respaldo cuando el punto focal no es un porcentaje', () => {
    const injection = { x: '0%; background: url(https://evil/x.png)', y: 50 } as never;

    const image = heroImageFromSettings({ hero_image: { src: '/x.webp', focal_point: injection } });

    expect(image?.focalPoint).toEqual(BUNDLED_HERO_IMAGE.focalPoint);
  });

  it('cae al respaldo con un punto focal fuera de rango o ausente', () => {
    const fueraDeRango = { x: 400, y: -1 } as never;

    expect(heroImageFromSettings({ hero_image: { src: '/x.webp', focal_point: fueraDeRango } })?.focalPoint).toEqual(
      BUNDLED_HERO_IMAGE.focalPoint
    );
    expect(heroImageFromSettings({ hero_image: { src: '/x.webp', focal_point: {} as never } })?.focalPoint).toEqual(
      BUNDLED_HERO_IMAGE.focalPoint
    );
  });
});

describe('heroVideoFromSettings', () => {
  const video = { type: 'video/mp4; codecs="avc1.640032"', src: 'https://cdn/hero.mp4', width: 1920 };

  it('traduce el video del ajuste', () => {
    expect(heroVideoFromSettings({ hero_image: null, hero_video: { sources: [video] } })).toEqual({
      sources: [video],
    });
  });

  it('un fondo quieto es una portada valida, no un dato faltante', () => {
    expect(heroVideoFromSettings({ hero_image: null, hero_video: null })).toBeNull();
    expect(heroVideoFromSettings({ hero_image: null })).toBeNull();
    expect(heroVideoFromSettings({ hero_image: null, hero_video: { sources: [] } })).toBeNull();
  });

  it('descarta una fuente sin codec declarado', () => {
    // Sin `type`, un navegador que no soporte el formato contesta que si puede,
    // descarga el archivo entero y falla: nunca llega a la fuente siguiente.
    const sinTipo = { src: 'https://cdn/hero.mp4', width: 1920 } as never;

    expect(heroVideoFromSettings({ hero_image: null, hero_video: { sources: [sinTipo] } })).toBeNull();
  });
});
