import type { Page } from '@playwright/test';

/**
 * Utilidades compartidas por los recorridos.
 *
 * Existen porque la misma accion se alcanza distinto segun el ancho: en
 * escritorio los controles estan en la barra, y en movil dentro del indice a
 * pantalla completa. Resolver esa bifurcacion en cada prueba la llenaba de
 * condicionales sobre el CSS, que es justo lo que una prueba de extremo a extremo
 * no deberia conocer.
 */

/** Cambia el idioma, este el control en la barra o dentro del indice. */
export async function cambiarIdioma(page: Page) {
  const enLaBarra = page.getByRole('button', { name: /switch to english|cambiar a español/i });

  // Se decide por visibilidad y no por ancho: asi la prueba no repite los puntos
  // de corte del CSS y sigue valiendo si cambian.
  if (await enLaBarra.first().isVisible()) {
    await enLaBarra.first().click();
    return;
  }

  await abrirIndice(page);
  await page.getByRole('button', { name: /switch to english|cambiar a español/i }).click();
}

/** Abre el indice a pantalla completa. */
export async function abrirIndice(page: Page) {
  await page.getByRole('button', { name: /^(indice|index)$/i }).click();
}
