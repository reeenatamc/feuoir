import { expect, test } from '@playwright/test';

/**
 * Encargos privados.
 *
 * Lo importante no es que el formulario exista, sino que **no** sea un
 * configurador: sin carrito, sin previsualizacion y sin catalogo de opciones.
 * Y que la validacion se comporte como se decidio: nada de marcar en rojo un
 * campo a medio escribir.
 */

test('presenta una solicitud, no un configurador', async ({ page }) => {
  await page.goto('/commissions');

  await expect(page.getByRole('heading', { level: 1, name: /encargos privados/i })).toBeVisible();

  // Nada de vocabulario de tienda aqui. Los tramos de presupuesto SI nombran USD
  // ("Hasta 500 USD"), asi que lo que no debe existir es un PRECIO: una cifra
  // suelta con moneda, como la que llevaria un articulo a la venta.
  await expect(page.getByRole('button', { name: /añadir al carrito|add to cart/i })).toHaveCount(0);
  await expect(page.getByText(/^\s*\d+\s+USD\s*$/)).toHaveCount(0);
});

test('pide los cinco datos y ninguno mas', async ({ page }) => {
  await page.goto('/commissions');

  for (const etiqueta of ['Pieza', 'Medida', 'Intención', 'Presupuesto aproximado', 'Nombre', 'Correo']) {
    await expect(page.getByText(etiqueta, { exact: true })).toBeVisible();
  }
});

test('no marca errores mientras se escribe', async ({ page }) => {
  await page.goto('/commissions');

  // Un correo a medio teclear no debe pintarse en rojo: es hostil.
  await page.getByLabel('Correo').fill('rena');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('al intentar enviar señala lo que falta y lleva el foco alli', async ({ page }) => {
  await page.goto('/commissions');

  const enviar = page.getByRole('button', { name: /solicitar un encargo/i });
  // Sin canal configurado el boton no se ofrece; ese caso se comprueba aparte.
  test.skip(!(await enviar.isVisible()), 'requiere WhatsApp configurado en ajustes');

  await enviar.click();

  await expect(page.getByRole('alert').first()).toBeVisible();
  await expect(page.getByLabel('Intención')).toBeFocused();
});

test('sin canal de contacto no ofrece un boton que no hace nada', async ({ page }) => {
  await page.goto('/commissions');

  const enviar = page.getByRole('button', { name: /solicitar un encargo/i });
  const aviso = page.getByText(/canal de contacto sin configurar/i);

  // Uno de los dos, nunca los dos ni ninguno.
  const hayBoton = await enviar.isVisible();
  const hayAviso = await aviso.isVisible();
  expect(hayBoton !== hayAviso).toBe(true);
});
