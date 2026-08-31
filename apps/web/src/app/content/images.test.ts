import { describe, expect, it } from 'vitest';
import { imageFromPayload, imagesFromPayload } from './images';

describe('imageFromPayload', () => {
  it('traduce el contrato de srcset tal como llega', () => {
    // El `srcset` viene armado por el servidor: aqui no se concatena nada.
    const image = imageFromPayload({
      alt: 'Tabla Feuoir de frente',
      width: 1560,
      height: 2400,
      focal_point: { x: 62, y: 38 },
      src: 'https://cdn/960.webp',
      sources: [
        { type: 'image/avif', srcset: 'https://cdn/320.avif 320w, https://cdn/640.avif 640w' },
        { type: 'image/webp', srcset: 'https://cdn/320.webp 320w, https://cdn/640.webp 640w' },
      ],
    });

    expect(image?.focalPoint).toEqual({ x: 62, y: 38 });
    expect(image?.sources[0].type).toBe('image/avif');
  });

  it('conserva el orden de las fuentes', () => {
    // AVIF primero: el navegador se queda con el primer tipo que sabe
    // decodificar, y reordenar serviria el formato mas pesado a quien podia
    // recibir el mas liviano.
    const image = imageFromPayload({
      src: 'https://cdn/960.webp',
      sources: [
        { type: 'image/avif', srcset: 'https://cdn/320.avif 320w' },
        { type: 'image/webp', srcset: 'https://cdn/320.webp 320w' },
      ],
    });

    expect(image?.sources.map((s) => s.type)).toEqual(['image/avif', 'image/webp']);
  });

  it('sin src no hay imagen', () => {
    // Una entrada incompleta tiene que comportarse como una ausente: un `<img>`
    // con src vacio dibuja el icono de imagen rota.
    expect(imageFromPayload({ alt: 'sin archivo' })).toBeNull();
    expect(imageFromPayload({ src: '' })).toBeNull();
    expect(imageFromPayload(null)).toBeNull();
  });

  it('sin punto focal encuadra al centro, que es lo que hace el navegador solo', () => {
    expect(imageFromPayload({ src: 'https://cdn/960.webp' })?.focalPoint).toEqual({ x: 50, y: 50 });
  });

  it('un alt ausente es un alt vacio, que es un alt valido', () => {
    // Vacio significa decorativa: la foto no agrega nada al texto que la rodea.
    expect(imageFromPayload({ src: 'https://cdn/960.webp' })?.alt).toBe('');
  });

  it('no inventa medidas: sin ellas se omiten los atributos', () => {
    // `width="0"` colapsaria la imagen; sin atributo el navegador la mide.
    const image = imageFromPayload({ src: 'https://cdn/960.webp' });

    expect(image?.width).toBeUndefined();
    expect(image?.height).toBeUndefined();
  });
});

describe('imagesFromPayload', () => {
  it('descarta las inservibles y conserva las demas', () => {
    const images = imagesFromPayload([
      { src: 'https://cdn/a.webp' },
      { alt: 'sin archivo' },
      { src: 'https://cdn/b.webp' },
    ]);

    expect(images.map((i) => i.src)).toEqual(['https://cdn/a.webp', 'https://cdn/b.webp']);
  });

  it('una pieza sin fotos da una lista vacia, no un fallo', () => {
    expect(imagesFromPayload([])).toEqual([]);
    expect(imagesFromPayload(undefined)).toEqual([]);
  });
});
