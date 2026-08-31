import { expect, test } from '@playwright/test';
import { abrirIndice, cambiarIdioma } from './helpers';
import { servirCatalogo } from './catalog';

/**
 * Recorrido del sitio publico.
 *
 * Comprueba lo que solo se ve corriendo la aplicacion entera: que las rutas
 * resuelvan, que el vocabulario de la casa llegue a la pantalla, y que el
 * conmutador de idioma cambie la pagina de verdad y no solo el estado interno.
 */

const SECCIONES = [
  { nombre: 'Objetos', ruta: '/objects', titulo: 'Objetos' },
  { nombre: 'Archivo', ruta: '/archive', titulo: 'Archivo' },
  { nombre: 'Encargos', ruta: '/commissions', titulo: 'Encargos privados' },
] as const;

// Dos de las tres secciones piden el catalogo. Nada de lo que se comprueba aqui
// depende de que piezas haya, pero sirviendolas fijas el recorrido no necesita
// backend levantado ni espera a que uno conteste.
test.beforeEach(async ({ page }) => {
  await servirCatalogo(page);
});

test.describe('rutas', () => {
  // Que la ruta cargue y que se llegue a ella son dos hechos distintos, y se
  // comprueban por separado: si se mezclan, un selector roto en la barra se
  // reporta como "la pagina no carga", que manda a buscar donde no es.
  for (const { ruta, titulo } of SECCIONES) {
    test(`${ruta} carga su pagina`, async ({ page }) => {
      await page.goto(ruta);
      await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
    });
  }

  test('las rutas anteriores siguen resolviendo', async ({ page }) => {
    // Cambiar el vocabulario no debe romper enlaces ya compartidos.
    for (const ruta of ['/shop', '/custom', '/cart']) {
      const respuesta = await page.goto(ruta);
      expect(respuesta?.status(), `${ruta} deberia responder`).toBeLessThan(400);
    }
  });
});

test.describe('indice', () => {
  test('lleva a las tres secciones', async ({ page }) => {
    for (const { nombre, ruta } of SECCIONES) {
      await page.goto('/');
      await abrirIndice(page);

      // Dentro del indice, y no en la barra que queda debajo.
      const indice = page.locator('.fixed.inset-0');
      await indice.getByRole('link', { name: nombre, exact: true }).click();

      await expect(page).toHaveURL(new RegExp(`${ruta}$`));
    }
  });

  test('sus entradas son enlaces, no botones', async ({ page }) => {
    // Importa para el teclado y para abrir en otra pestana: un `div` con onClick
    // no hace ninguna de las dos.
    await page.goto('/');
    await abrirIndice(page);

    const indice = page.locator('.fixed.inset-0');
    for (const { nombre } of SECCIONES) {
      await expect(indice.getByRole('link', { name: nombre, exact: true })).toBeVisible();
    }
  });
});

/**
 * La barra sobre la sala clara.
 *
 * La barra es hermana de <main>, o sea que flota fuera del ambito donde la sala
 * clara redefine sus tokens. Antes se quedaba con la tinta del modo y sobre la
 * sala quedaba crema sobre crema: 1,02:1 medido, o sea invisible. En movil
 * `INDICE` es la unica via al resto del sitio, asi que esto no es un detalle de
 * color sino la navegacion entera.
 *
 * Se comprueba el contraste real y no el atributo: el atributo es como esta
 * resuelto hoy, y el contraste es lo que hay que garantizar.
 */
test.describe('legibilidad de la barra', () => {
  /** Luminancia relativa de un `rgb(...)` resuelto, segun WCAG. */
  function luminance(color: string): number {
    const [r, g, b] = color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    const channel = (v: number) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  }

  function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }

  test('se lee cuando la sala clara pasa por debajo', async ({ page }) => {
    await page.goto('/');
    // Hasta aqui la barra flota sobre la portada oscura.
    await page.locator('#series-001').scrollIntoViewIfNeeded();

    const bolsa = page.getByRole('link', { name: /bolsa/i });
    await expect(bolsa).toBeVisible();

    await expect
      .poll(async () => {
        const tinta = await bolsa.evaluate((el) => getComputedStyle(el).color);
        const sala = await page
          .locator('#series-001')
          .evaluate((el) => getComputedStyle(el).backgroundColor);
        return contrast(tinta, sala);
      })
      // El minimo de WCAG AA para texto pequeño. Antes de la correccion daba 1,02.
      .toBeGreaterThan(4.5);
  });

  test('vuelve a la tinta del modo sobre la portada', async ({ page }) => {
    // La barra transparente sobre la foto es una decision del modo, no un
    // descuido: si el arreglo se quedara pegado, la portada perderia su barra.
    await page.goto('/');
    await page.locator('#series-001').scrollIntoViewIfNeeded();
    await expect(page.locator('nav.nav-bar')).toHaveAttribute('data-surface', 'museum');

    await page.evaluate(() => window.scrollTo(0, 0));

    await expect(page.locator('nav.nav-bar')).not.toHaveAttribute('data-surface', 'museum');
  });

  test('tambien se lee en las paginas que son sala clara entera', async ({ page }) => {
    await page.goto('/objects');
    await page.evaluate(() => window.scrollTo(0, 400));

    const bolsa = page.getByRole('link', { name: /bolsa/i });

    await expect
      .poll(async () => {
        const tinta = await bolsa.evaluate((el) => getComputedStyle(el).color);
        const sala = await page
          .locator('.section--museum')
          .first()
          .evaluate((el) => getComputedStyle(el).backgroundColor);
        return contrast(tinta, sala);
      })
      .toBeGreaterThan(4.5);
  });
});

test.describe('marca', () => {
  test('en el home solo esta en movil; fuera del home, siempre', async ({ page }) => {
    const marca = page.getByRole('link', { name: /feuoir/i });

    // En escritorio el logotipo grande de la portada comparte pantalla con la
    // barra: repetirlo arriba carga la pagina sin agregar nada.
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.goto('/');
    await expect(marca).toBeHidden();

    // En movil ese logotipo cae a media pantalla, cruzando el borde del video, y
    // la barra se queda sin nada a la izquierda. Ahi la marca vuelve.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(marca).toBeVisible();

    // Fuera del home no hay logotipo grande en ninguna de las dos formas.
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.goto('/archive');
    await expect(marca).toBeVisible();
  });
});

test.describe('idioma', () => {
  test('el conmutador cambia el texto de la pagina, no solo el estado', async ({ page }) => {
    await page.goto('/objects');
    await expect(page.getByRole('heading', { level: 1, name: 'Objetos' })).toBeVisible();

    await cambiarIdioma(page);

    await expect(page.getByRole('heading', { level: 1, name: 'Objects' })).toBeVisible();
  });

  test('el idioma elegido sobrevive a recargar', async ({ page }) => {
    await page.goto('/objects');
    await cambiarIdioma(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Objects' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Objects' })).toBeVisible();
  });
});
