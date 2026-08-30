import { expect, test } from '@playwright/test';
import { cambiarIdioma } from './helpers';

/**
 * El archivo y la ficha de pieza.
 *
 * Lo que se comprueba aqui es el contrato de identidad de FEUOIR: que una pieza
 * se presente por su numero y su estado, que el precio no aparezca en los
 * listados, y que el codigo `S001 / O003 / 2026` sea el mismo en todos lados.
 */

test.describe('archivo', () => {
  test('lista cada pieza con numero, nombre y estado', async ({ page }) => {
    await page.goto('/archive');

    const fila = page.getByRole('link', { name: /Burn Jacket I/ }).first();
    await expect(fila).toBeVisible();
    await expect(fila).toContainText('001');
    await expect(fila).toContainText(/archivado/i);
  });

  test('conserva las piezas que ya no estan a la venta', async ({ page }) => {
    // Es el nucleo del concepto: nada sale del registro.
    await page.goto('/archive');
    const archivadas = page.getByRole('link').filter({ hasText: /archivado/i });
    await expect(archivadas.first()).toBeVisible();
    expect(await archivadas.count()).toBeGreaterThan(0);
  });

  test('no muestra precios en el listado', async ({ page }) => {
    await page.goto('/archive');
    const lista = page.getByRole('list').first();
    await expect(lista).not.toContainText('USD');
  });

  test('una fila lleva a la ficha de esa pieza', async ({ page }) => {
    await page.goto('/archive');
    await page.getByRole('link', { name: /Object T-03/ }).first().click();
    await expect(page).toHaveURL(/\/objects\/003$/);
  });
});

test.describe('ficha de pieza', () => {
  test('documenta la pieza con su codigo y especificacion', async ({ page }) => {
    await page.goto('/objects/003');

    await expect(page.getByText('S001 / O003 / 2026')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('003');

    for (const etiqueta of ['Serie', 'Materiales', 'Tratamiento', 'Acabado', 'Edición', 'Procedencia']) {
      await expect(page.getByText(etiqueta, { exact: true })).toBeVisible();
    }
  });

  test('traduce los materiales en vez de mostrarlos en ingles', async ({ page }) => {
    // Por eso los materiales se guardan como claves y no como texto.
    await page.goto('/objects/003');
    await expect(page.getByText('Algodón', { exact: true })).toBeVisible();

    await cambiarIdioma(page);
    await expect(page.getByText('Cotton', { exact: true })).toBeVisible();
  });

  test('el precio aparece solo en las piezas disponibles', async ({ page }) => {
    await page.goto('/objects/003');
    await expect(page.getByText(/180 USD/)).toBeVisible();

    // 001 esta archivada: ofrecerle precio invitaria a intentar comprarla.
    await page.goto('/objects/001');
    await expect(page.getByText(/USD/)).toHaveCount(0);
  });

  test('la accion cambia segun el estado de la pieza', async ({ page }) => {
    await page.goto('/objects/003');
    await expect(page.getByRole('link', { name: /adquirir/i })).toBeVisible();

    await page.goto('/objects/001');
    await expect(page.getByRole('link', { name: /solicitar un encargo/i })).toBeVisible();
  });

  test('un numero inexistente avisa en vez de romper', async ({ page }) => {
    await page.goto('/objects/999');
    await expect(page.getByText(/no existe ninguna pieza/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /volver a la serie/i })).toBeVisible();
  });
});
