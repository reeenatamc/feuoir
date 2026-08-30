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
