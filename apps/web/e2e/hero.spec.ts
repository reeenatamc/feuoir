import { expect, test } from '@playwright/test';
import type { Page, Route } from '@playwright/test';
import { servirCatalogo } from './catalog';

/**
 * Fotografia a sangre de la portada.
 *
 * Todos los recorridos simulan la respuesta del backend. No es por comodidad:
 * lo que hay que comprobar es como reacciona la portada a cada respuesta
 * posible -- incluida la ausencia de respuesta -- y contra un servidor real solo
 * se puede provocar una de ellas.
 */

const SETTINGS = '**/api/settings/';

// La home tambien pinta la serie vigente debajo del hero. Se sirve fija para que
// estos recorridos dependan solo de los ajustes, que es lo que comprueban.
test.beforeEach(async ({ page }) => {
  await servirCatalogo(page);
});

/** Una foto configurada desde el panel. Apunta a un archivo que existe. */
function heroSettings(overrides: Record<string, unknown> = {}) {
  return {
    business_name: 'Feuoir',
    whatsapp: '',
    currency: 'USD',
    shipping_cost: '10.00',
    tax_rate: '0.0000',
    hero_image: {
      alt: 'Coche en llamas en la carretera',
      width: 1500,
      height: 1000,
      focal_point: { x: 50, y: 50 },
      src: '/flame.png',
      sources: [{ type: 'image/webp', srcset: '/flame.png 1500w' }],
      ...overrides,
    },
    hero_video: null,
  };
}

/**
 * El mismo ajuste, pero con un video encima de la foto.
 *
 * Dos escalones y dos codecs, como los publica el backend: es lo que permite
 * comprobar que a una ventana angosta le toca el archivo chico y que dentro del
 * escalon manda el orden -- AV1 primero, porque el navegador se queda con la
 * primera fuente que sabe reproducir.
 */
function videoSettings() {
  return {
    ...heroSettings(),
    hero_video: {
      sources: [
        { type: 'video/mp4; codecs="av01.0.05M.08"', src: '/hero-sm.av1.mp4', width: 1280 },
        { type: 'video/mp4; codecs="avc1.64001f"', src: '/hero-sm.mp4', width: 1280 },
        { type: 'video/mp4; codecs="av01.0.08M.08"', src: '/hero.av1.mp4', width: 1920 },
        { type: 'video/mp4; codecs="avc1.640032"', src: '/hero.mp4', width: 1920 },
      ],
    },
  };
}

async function serveSettings(page: Page, body: unknown) {
  await page.route(SETTINGS, (route: Route) => route.fulfill({ json: body }));
}

/** Deja la API sin responder y avisa cuando la portada ya lo intento. */
async function breakSettings(page: Page) {
  let attempts = 0;
  await page.route(SETTINGS, (route: Route) => {
    attempts += 1;
    return route.abort('failed');
  });
  return () => attempts;
}

function backdrop(page: Page) {
  return page.locator('.hero-backdrop');
}

test.describe('foto del hero', () => {
  test('usa la que se configuro en el panel', async ({ page }) => {
    await serveSettings(page, heroSettings());

    await page.goto('/');

    await expect(backdrop(page)).toHaveCSS('background-image', /flame\.png/);
  });

  test('el punto focal decide el encuadre', async ({ page }) => {
    // El hero se recorta con `cover`: sin punto focal, en una pantalla angosta
    // la foto se corta por donde caiga.
    await serveSettings(page, heroSettings({ focal_point: { x: 20, y: 80 } }));

    await page.goto('/');

    await expect(backdrop(page)).toHaveCSS('background-position', /20% 80%/);
  });

  test('describe la foto solo cuando el panel le puso texto', async ({ page }) => {
    await serveSettings(page, heroSettings());

    await page.goto('/');

    await expect(page.getByRole('img', { name: 'Coche en llamas en la carretera' })).toBeVisible();
  });

  test('sin foto cargada se queda con la empaquetada', async ({ page }) => {
    // Tienda recien instalada: no es un error, y la portada tiene que verse.
    await serveSettings(page, { ...heroSettings(), hero_image: null });

    await page.goto('/');

    await expect(backdrop(page)).toHaveCSS('background-image', /hero-poster\.(avif|webp)/);
  });

  test('con la API caida la portada no se queda sin fondo', async ({ page }) => {
    const attempts = await breakSettings(page);

    await page.goto('/');

    // Primero que el intento ocurrio de verdad: sin esto la prueba pasaria
    // igual comprobando el estado anterior a la peticion.
    await expect.poll(attempts).toBeGreaterThan(0);
    await expect(backdrop(page)).toHaveCSS('background-image', /hero-poster\.(avif|webp)/);
    // Y sigue siendo decorativa: nadie describio esta foto.
    await expect(backdrop(page)).toHaveAttribute('aria-hidden', 'true');
  });

  test('con foto pero sin video, el hero no monta ningun reproductor', async ({ page }) => {
    await serveSettings(page, heroSettings());

    await page.goto('/');

    await expect(backdrop(page)).toHaveCSS('background-image', /flame\.png/);
    await expect(page.locator('video')).toHaveCount(0);
  });

  test('el modo sobrio sigue sin foto aunque haya una configurada', async ({ page }) => {
    // El token que escribe el panel dice CUAL es la foto; que este modo use foto
    // o no es una decision suya. Si un solo token hiciera las dos cosas, la foto
    // del panel se colaria aqui y le romperia el diseño.
    await serveSettings(page, heroSettings());
    await page.addInitScript(() => window.localStorage.setItem('feuoir_ui_mode', 'bored'));

    await page.goto('/');

    // Ninguna capa dibuja una imagen: ni la del panel ni la empaquetada.
    await expect(backdrop(page)).not.toHaveCSS('background-image', /url\(/);
  });
});

/**
 * Video de fondo.
 *
 * Se prueba en los dos proyectos: desde que la portada muestra la foto como
 * banda en movil, el video ya no depende del ancho. La unica condicion que queda
 * es la preferencia de movimiento, y tiene su propio recorrido.
 */
test.describe('video del hero', () => {
  test('se reproduce encima de la foto', async ({ page }) => {
    await serveSettings(page, videoSettings());

    await page.goto('/');

    const video = page.locator('video.hero-video');
    await expect(video).toHaveCount(1);
    // Los cuatro atributos sin los que ningun navegador arranca solo.
    await expect(video).toHaveJSProperty('muted', true);
    await expect(video).toHaveJSProperty('loop', true);
    await expect(video).toHaveJSProperty('autoplay', true);
    await expect(video).toHaveJSProperty('playsInline', true);
    // El poster es la misma URL que pinta la capa de abajo: un solo archivo.
    await expect(video).toHaveAttribute('poster', '/flame.png');
    await expect(backdrop(page)).toHaveCSS('background-image', 'url("http://localhost:5173/flame.png")');
  });

  test('no se monta con movimiento reducido', async ({ page }) => {
    // Un bucle que nadie pidio es exactamente lo que esta preferencia existe
    // para evitar. Queda la foto fija.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await serveSettings(page, videoSettings());

    await page.goto('/');

    await expect(backdrop(page)).toHaveCSS('background-image', /flame\.png/);
    await expect(page.locator('video')).toHaveCount(0);
  });

  test('a un telefono le toca el escalon chico, y en AV1', async ({ page }) => {
    // `<video>` no tiene `srcset`: se queda con la primera fuente que sabe
    // reproducir, sin mirar el tamano. El orden ES la decision, y aqui se
    // comprueban sus dos mitades -- el escalon por ancho de ventana y el codec.
    await page.setViewportSize({ width: 390, height: 844 });
    await serveSettings(page, videoSettings());

    await page.goto('/');

    const fuentes = page.locator('video.hero-video source');
    await expect(fuentes).toHaveCount(2);
    await expect(fuentes.first()).toHaveAttribute('src', '/hero-sm.av1.mp4');
    await expect(fuentes.nth(1)).toHaveAttribute('src', '/hero-sm.mp4');
  });

  test('en un telefono se reproduce de verdad, no solo se monta', async ({ page }) => {
    // Montar el elemento no prueba nada: si el navegador no arrancara solo, la
    // portada se quedaria en el poster y nadie se enteraria hasta produccion.
    await page.setViewportSize({ width: 390, height: 844 });
    await serveSettings(page, videoSettings());

    await page.goto('/');

    const video = page.locator('video.hero-video');
    await expect(video).toHaveJSProperty('paused', false);
    await expect
      .poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime))
      .toBeGreaterThan(0);
  });

  test('el modo sobrio no baja el video', async ({ page }) => {
    await serveSettings(page, videoSettings());
    await page.addInitScript(() => window.localStorage.setItem('feuoir_ui_mode', 'bored'));

    await page.goto('/');

    await expect(page.locator('video')).toHaveCount(0);
  });
});

/**
 * La portada en movil.
 *
 * La foto deja de ir a sangre y pasa a ser una banda con el bloque editorial
 * montado sobre su borde. Lo que se comprueba no es el diseño sino sus dos
 * consecuencias: que el logotipo cruce ese borde -- es lo que hace que la foto y
 * la superficie se lean como una sola composicion -- y que el escritorio siga
 * con la portada a pantalla completa.
 */
test.describe('banda del hero', () => {
  test('en movil el logotipo cruza el borde de la foto', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await serveSettings(page, heroSettings());

    await page.goto('/');

    const banda = (await page.locator('.hero-band').boundingBox())!;
    const titular = (await page.getByRole('heading', { level: 1 }).boundingBox())!;
    const borde = banda.y + banda.height;

    // Una franja, no la ventana entera: con 1,16:1 sobre 390 puntos de ancho son
    // 336 de alto, que es la proporcion con la que la mujer y el fuego entran los
    // dos en el recorte.
    expect(banda.height).toBeGreaterThan(300);
    expect(banda.height).toBeLessThan(400);
    // Y el logotipo monta a caballo sobre ese borde: empieza dentro de la foto y
    // termina fuera. Entero de un lado o del otro, la portada vuelve a leerse
    // como foto arriba y bloque negro debajo, que es lo que se quiso quitar.
    expect(titular.y).toBeLessThan(borde);
    expect(titular.y + titular.height).toBeGreaterThan(borde);
  });

  test('en escritorio la portada sigue ocupando la ventana', async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: 900 });
    await serveSettings(page, heroSettings());

    await page.goto('/');

    const banda = (await page.locator('.hero-band').boundingBox())!;
    const titular = (await page.getByRole('heading', { level: 1 }).boundingBox())!;

    // La foto va a sangre y el titular flota encima, dentro de ella.
    expect(banda.height).toBeGreaterThanOrEqual(900);
    expect(titular.y).toBeGreaterThan(banda.y);
    expect(titular.y).toBeLessThan(banda.y + banda.height);
  });
});
