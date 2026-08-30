import { expect, test } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

/**
 * Fotografia a sangre de la portada.
 *
 * Todos los recorridos simulan la respuesta del backend. No es por comodidad:
 * lo que hay que comprobar es como reacciona la portada a cada respuesta
 * posible -- incluida la ausencia de respuesta -- y contra un servidor real solo
 * se puede provocar una de ellas.
 */

const SETTINGS = '**/api/settings/';

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

/** El mismo ajuste, pero con un video encima de la foto. */
function videoSettings() {
  return {
    ...heroSettings(),
    hero_video: {
      sources: [{ type: 'video/mp4; codecs="avc1.640032"', src: '/hero.mp4', width: 1920 }],
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
 * Se prueba en `chromium` y no en el proyecto movil porque la decision que hay
 * que verificar es justamente que en una pantalla angosta NO haya video, y eso
 * tiene su propio recorrido mas abajo.
 */
test.describe('video del hero', () => {
  test('se reproduce en escritorio, encima de la foto', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'el video no se monta en movil');
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
    // Un bucle a pantalla completa que nadie pidio es exactamente lo que esta
    // preferencia existe para evitar. Queda la foto fija.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await serveSettings(page, videoSettings());

    await page.goto('/');

    await expect(backdrop(page)).toHaveCSS('background-image', /flame\.png/);
    await expect(page.locator('video')).toHaveCount(0);
  });

  test('no se monta en una pantalla de telefono', async ({ page }) => {
    // La toma es de 1,94:1 y el hero recorta con `cover`: en vertical se ve
    // menos de un cuarto del cuadro, y el movimiento deja de significar algo.
    await page.setViewportSize({ width: 390, height: 844 });
    await serveSettings(page, videoSettings());

    await page.goto('/');

    await expect(backdrop(page)).toHaveCSS('background-image', /flame\.png/);
    await expect(page.locator('video')).toHaveCount(0);
  });

  test('el modo sobrio no baja el video', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'el video no se monta en movil');
    await serveSettings(page, videoSettings());
    await page.addInitScript(() => window.localStorage.setItem('feuoir_ui_mode', 'bored'));

    await page.goto('/');

    await expect(page.locator('video')).toHaveCount(0);
  });
});
