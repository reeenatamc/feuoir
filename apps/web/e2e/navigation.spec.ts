import { expect, test } from '@playwright/test';
import { abrirIndice, cambiarIdioma } from './helpers';

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

test.describe('marca', () => {
  test('aparece en la barra fuera del home y no dentro', async ({ page }) => {
    // Decision deliberada: en el home el logotipo grande ya dice quien es, y
    // repetirlo arriba carga la pagina sin agregar nada.
    await page.goto('/');
    await expect(page.getByRole('link', { name: /feuoir/i })).toHaveCount(0);

    await page.goto('/archive');
    await expect(page.getByRole('link', { name: /feuoir/i })).toBeVisible();
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
