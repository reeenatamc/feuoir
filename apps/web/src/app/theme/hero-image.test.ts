import { describe, expect, it } from 'vitest';
import { BUNDLED_HERO_IMAGE, BUNDLED_HERO_VIDEO } from '../content/hero';
import type { HeroImage } from '../content/hero';
import {
  HERO_IMAGE_TOKEN,
  HERO_POSITION_TOKEN,
  heroImageTokens,
  pickSrcsetUrl,
  pickVideoSources,
} from './hero-image';

const SRCSET = 'https://cdn/320.webp 320w, https://cdn/960.webp 960w, https://cdn/1920.webp 1920w';

const configured: HeroImage = {
  alt: 'Coche en llamas',
  focalPoint: { x: 62, y: 38 },
  src: 'https://cdn/960.webp',
  sources: [
    { type: 'image/avif', srcset: 'https://cdn/320.avif 320w, https://cdn/1920.avif 1920w' },
    { type: 'image/webp', srcset: SRCSET },
  ],
};

describe('pickSrcsetUrl', () => {
  it('elige el archivo mas chico que cubre el ancho pedido', () => {
    // Mandar el de 1920 a una pantalla de 900 es descargar cuatro veces lo
    // necesario para la imagen que decide el LCP.
    expect(pickSrcsetUrl(SRCSET, 900)).toBe('https://cdn/960.webp');
  });

  it('acepta el ancho exacto sin subir al siguiente', () => {
    expect(pickSrcsetUrl(SRCSET, 960)).toBe('https://cdn/960.webp');
  });

  it('cae al mayor disponible cuando ninguno alcanza', () => {
    // El servidor nunca amplia: si el master era chico, esto es lo que hay.
    expect(pickSrcsetUrl(SRCSET, 4000)).toBe('https://cdn/1920.webp');
  });

  it('devuelve null con un srcset vacio o ilegible', () => {
    expect(pickSrcsetUrl('', 900)).toBeNull();
    expect(pickSrcsetUrl('https://cdn/x.webp', 900)).toBeNull();
  });
});

const opciones = { targetWidth: 900, negotiatesFormat: true, asPoster: false };

describe('heroImageTokens', () => {
  it('negocia el formato cuando el navegador entiende image-set', () => {
    const tokens = heroImageTokens(configured, opciones);

    // AVIF primero y con su tipo declarado: pesa alrededor de un 30% menos y el
    // navegador descarta solo el que no sabe decodificar.
    expect(tokens[HERO_IMAGE_TOKEN]).toBe(
      'image-set(url("https://cdn/1920.avif") type("image/avif"), url("https://cdn/960.webp") type("image/webp"))'
    );
  });

  it('sin negociacion emite un url() de WebP', () => {
    // `image-set()` no reconocido invalidaria la declaracion entera y dejaria el
    // hero sin foto. WebP lo soportan todos los navegadores vigentes.
    expect(heroImageTokens(configured, { ...opciones, negotiatesFormat: false })[HERO_IMAGE_TOKEN]).toBe(
      'url("https://cdn/960.webp")'
    );
  });

  it('como poster usa la misma URL que el atributo del video', () => {
    // Si la capa de la foto y el `poster` eligieran archivos distintos, la
    // portada descargaria dos veces la misma imagen.
    expect(heroImageTokens(configured, { ...opciones, asPoster: true })[HERO_IMAGE_TOKEN]).toBe(
      `url("${configured.src}")`
    );
  });

  it('lleva el punto focal a porcentajes de background-position', () => {
    expect(heroImageTokens(configured, opciones)[HERO_POSITION_TOKEN]).toBe('62% 38%');
  });

  it('la foto empaquetada es el primer fotograma del video', () => {
    const tokens = heroImageTokens(BUNDLED_HERO_IMAGE, opciones);

    expect(tokens[HERO_IMAGE_TOKEN]).toContain('/hero-poster.avif');
    // A la izquierda del centro: es el ancla que deja a la mujer dentro del
    // recorte movil. El motivo esta junto al valor, en `content/hero.ts`.
    expect(tokens[HERO_POSITION_TOKEN]).toBe('40% 50%');
  });
});

describe('escapado del valor CSS', () => {
  // `heroImageFromSettings` filtra el `src`, pero las URLs de cada `srcset` y
  // el `type` de cada fuente llegan del mismo JSON y no pasan por ese filtro:
  // el escapado de aca es lo unico entre ellos y una declaracion CSS abierta.
  const sinEscapar = (value: string) => value.match(/(?<!\\)"/g) ?? [];

  it('una comilla en la URL no cierra el url()', () => {
    const hostil: HeroImage = {
      ...configured,
      src: 'https://cdn/a.webp") ;background:url("https://evil/x.png',
    };

    const value = heroImageTokens(hostil, { ...opciones, asPoster: true })[HERO_IMAGE_TOKEN];

    // Dos comillas sin escapar: las que abren y cierran la unica cadena. Si el
    // valor inyectado hubiera cerrado la suya, habria cuatro o mas.
    expect(sinEscapar(value)).toHaveLength(2);
    expect(value).toContain('\\"');
  });

  it('una URL hostil en el srcset se escapa igual', () => {
    const hostil: HeroImage = {
      ...configured,
      sources: [{ type: 'image/webp', srcset: 'https://cdn/a.webp");color:red;x:url("y 960w' }],
    };

    const value = heroImageTokens(hostil, { ...opciones, negotiatesFormat: false })[HERO_IMAGE_TOKEN];

    expect(sinEscapar(value)).toHaveLength(2);
  });

  it('un type hostil no escapa de su propio type()', () => {
    const hostil: HeroImage = {
      ...configured,
      sources: [
        { type: 'image/avif");color:red;x:url("y', srcset: 'https://cdn/1920.avif 1920w' },
        { type: 'image/webp', srcset: SRCSET },
      ],
    };

    const value = heroImageTokens(hostil, opciones)[HERO_IMAGE_TOKEN];

    // Cuatro cadenas en la capa AVIF mas dos en la WebP: ocho comillas de
    // apertura y cierre, ninguna de mas.
    expect(sinEscapar(value)).toHaveLength(8);
  });

  it('no toca una URL normal', () => {
    // El escapado no puede cobrar peaje: lo que ya era valido sale igual.
    expect(heroImageTokens(configured, { ...opciones, asPoster: true })[HERO_IMAGE_TOKEN]).toBe(
      'url("https://cdn/960.webp")'
    );
  });
});

describe('pickVideoSources', () => {
  it('sirve 720p a una ventana angosta', () => {
    // 1080p en una ventana de 900 cuesta el doble de datos para el mismo pixel.
    const fuentes = pickVideoSources(BUNDLED_HERO_VIDEO, 900);

    expect(fuentes.map((s) => s.width)).toEqual([1280, 1280]);
  });

  it('sirve 1080p a una ventana ancha', () => {
    expect(pickVideoSources(BUNDLED_HERO_VIDEO, 1500).map((s) => s.width)).toEqual([1920, 1920]);
  });

  it('conserva el orden de codecs dentro del escalon', () => {
    // `<video>` se queda con la primera fuente que sabe reproducir, sin mirar
    // tamano ni peso: el orden ES la decision, y AV1 pesa un 40% menos.
    expect(pickVideoSources(BUNDLED_HERO_VIDEO, 1500).map((s) => s.type)).toEqual([
      'video/mp4; codecs="av01.0.08M.08"',
      'video/mp4; codecs="avc1.640032"',
    ]);
  });

  it('cae al mayor disponible cuando la ventana supera todo', () => {
    expect(pickVideoSources(BUNDLED_HERO_VIDEO, 4000).map((s) => s.width)).toEqual([1920, 1920]);
  });

  it('un video subido al panel trae una sola fuente y se usa siempre', () => {
    const subido = { sources: [{ type: 'video/mp4; codecs="avc1.640032"', src: '/x.mp4', width: 1920 }] };

    expect(pickVideoSources(subido, 400)).toHaveLength(1);
  });
});
