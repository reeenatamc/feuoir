import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { cambiarIdioma } from './helpers';
import { PIEZAS, romperCatalogo, servirCatalogo } from './catalog';

/**
 * El archivo y la ficha de pieza, ya alimentados por la API.
 *
 * Lo que se comprueba aqui es el contrato de identidad de FEUOIR: que una pieza
 * se presente por su numero y su estado, que el precio no aparezca en los
 * listados, y que el codigo `S001 / O003 / 2026` sea el mismo en todos lados.
 *
 * Las respuestas se sirven desde `catalog.ts` en vez de consultar el backend.
 * El motivo esta explicado alli: una suite que pasa segun lo que haya en la base
 * ese dia no comprueba nada, y el recorrido que mas importa -- el servidor
 * caido -- no se le puede pedir a un servidor de verdad.
 */

test.beforeEach(async ({ page }) => {
  await servirCatalogo(page);
});

test.describe('objetos', () => {
  test('lista las piezas de la serie vigente', async ({ page }) => {
    await page.goto('/objects');

    await expect(page.getByRole('heading', { level: 1, name: 'Objetos' })).toBeVisible();
    await expect(page.getByText('Ceniza', { exact: true })).toBeVisible();
    await expect(page.getByText('Pavesa', { exact: true })).toBeVisible();
  });

  test('los contadores salen del listado y no de los que manda el servidor', async ({ page }) => {
    // La serie servida declara `9 / 9 / 9`, y las piezas que llegan son dos
    // disponibles y una archivada. Manda lo que hay en la pagina.
    await page.goto('/objects');

    await expect(page.getByText(/02 disponible/i)).toBeVisible();
    await expect(page.getByText(/01 archivado/i)).toBeVisible();
  });

  test('sirve cada fotografia en varios formatos y anchos', async ({ page }) => {
    // El backend deriva cada foto a AVIF y WebP en varios anchos. Servir siempre
    // el mayor en el formato mas pesado es descargar de mas para una miniatura.
    await page.goto('/objects');

    const foto = page.locator('picture').first();
    await expect(foto.locator('source[type="image/avif"]')).toHaveAttribute('srcset', /\.avif 1920w/);
    await expect(foto.locator('source[type="image/webp"]')).toHaveAttribute('srcset', /960w.*1920w/);

    // El punto focal decide que parte sobrevive al recorte de la retícula.
    await expect(foto.locator('img')).toHaveCSS('object-position', '62% 38%');
  });

  test('sin piezas cargadas lo dice, en vez de dejar la retícula vacia', async ({ page }) => {
    await servirCatalogo(page, { piezas: [] });

    await page.goto('/objects');

    await expect(page.getByRole('status')).toContainText(/todavía no hay piezas/i);
  });

  test('con la API caida avisa y no se queda en blanco', async ({ page }) => {
    const intentos = await romperCatalogo(page);

    await page.goto('/objects');

    // Primero que el intento ocurrio: sin esto la prueba pasaria comprobando el
    // estado anterior a la peticion.
    await expect.poll(intentos).toBeGreaterThan(0);
    await expect(page.getByRole('alert')).toContainText(/no está disponible/i);
    // Y la pagina sigue siendo la pagina: el titular no depende del servidor.
    await expect(page.getByRole('heading', { level: 1, name: 'Objetos' })).toBeVisible();
    // Sin serie no se publican contadores: `00 DISPONIBLE` seria una afirmacion
    // sobre una serie que nadie llego a leer.
    await expect(page.getByText(/\d\d disponible/i)).toHaveCount(0);
    await expect(page.getByText(/\d\d archivado/i)).toHaveCount(0);
  });
});

/**
 * Reparto de la retícula.
 *
 * El reparto es editorial: cada posicion del ciclo tiene su ancho, su sangria y
 * su desplazamiento. Prefijado solo con `md:`, en movil se caian las tres cosas
 * a la vez y las piezas quedaban todas del mismo ancho, alineadas y sin
 * desplazamiento -- una lista, no una revista.
 *
 * Se comprueba la variacion y no medidas concretas: fijar "281 puntos" ataria la
 * prueba a la tipografia y a los margenes de hoy.
 */
test.describe('reparto de la retícula', () => {
  /** Ancho, borde izquierdo y desplazamiento de cada foto de la retícula. */
  function fotos(page: Page) {
    return page.evaluate(() =>
      [...document.querySelectorAll('main ul > li')].map((li) => {
        const caja = li.querySelector('div')!.getBoundingClientRect();
        return {
          width: Math.round(caja.width),
          left: Math.round(caja.left),
          marginTop: Math.round(Number.parseFloat(getComputedStyle(li).marginTop)),
        };
      })
    );
  }

  test('en movil las piezas no quedan todas iguales', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/objects');
    await expect(page.getByText('Ceniza', { exact: true })).toBeVisible();

    const piezas = await fotos(page);
    expect(piezas.length).toBeGreaterThan(3);

    // Las tres fuentes de tension, cada una comprobada por separado: si alguna
    // se pierde al tocar el reparto, el fallo dice cual.
    expect(new Set(piezas.map((p) => p.width)).size).toBeGreaterThan(2);
    expect(new Set(piezas.map((p) => p.left)).size).toBeGreaterThan(1);
    expect(piezas.some((p) => p.marginTop !== 0)).toBe(true);
  });

  test('en escritorio el reparto no cambia', async ({ page }) => {
    // El reparto de movil vive en la base y el de escritorio en los prefijos
    // `md:`. Aqui se afirma que los prefijos siguen ganando.
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.goto('/objects');
    await expect(page.getByText('Ceniza', { exact: true })).toBeVisible();

    const [uno, dos, tres, cuatro] = await fotos(page);

    // Los desplazamientos son medidas absolutas y no dependen del ancho: son la
    // afirmacion mas directa de que el escritorio quedo como estaba.
    expect([uno, dos, tres, cuatro].map((p) => p.marginTop)).toEqual([0, 128, 64, -32]);
    // Anchos de 7, 4, 5 y 6 columnas de doce, en ese orden.
    expect(uno.width).toBeGreaterThan(cuatro.width);
    expect(cuatro.width).toBeGreaterThan(tres.width);
    expect(tres.width).toBeGreaterThan(dos.width);
    // Y los arranques de columna: 1, 9, 2 y 7.
    expect(dos.left).toBeGreaterThan(cuatro.left);
    expect(cuatro.left).toBeGreaterThan(tres.left);
    expect(tres.left).toBeGreaterThan(uno.left);
  });
});

test.describe('archivo', () => {
  test('lista cada pieza con numero, nombre y estado', async ({ page }) => {
    await page.goto('/archive');

    const fila = page.getByRole('link', { name: /Pavesa/ }).first();
    await expect(fila).toBeVisible();
    await expect(fila).toContainText('003');
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
    await page.getByRole('link', { name: /Pavesa/ }).first().click();
    await expect(page).toHaveURL(/\/objects\/003$/);
  });

  test('con la API caida avisa en vez de mostrar un registro vacio', async ({ page }) => {
    const intentos = await romperCatalogo(page);

    await page.goto('/archive');

    await expect.poll(intentos).toBeGreaterThan(0);
    await expect(page.getByRole('alert')).toContainText(/no está disponible/i);
    await expect(page.getByRole('heading', { level: 1, name: 'Archivo' })).toBeVisible();
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
    // Por eso el backend manda claves (`cotton`) y no texto.
    await page.goto('/objects/002');
    await expect(page.getByText('Algodón', { exact: true })).toBeVisible();

    await cambiarIdioma(page);
    await expect(page.getByText('Cotton', { exact: true })).toBeVisible();
  });

  test('omite la fila del tratamiento cuando la pieza no lo declara', async ({ page }) => {
    // El backend los declara opcionales: no toda su mercaderia es una pieza.
    await servirCatalogo(page, {
      piezas: [{ ...PIEZAS[0], treatment: null, edition: null }],
    });

    await page.goto('/objects/001');

    await expect(page.getByText('Materiales', { exact: true })).toBeVisible();
    await expect(page.getByText('Tratamiento', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Edición', { exact: true })).toHaveCount(0);
  });

  test('el precio conserva los decimales que mando el servidor', async ({ page }) => {
    // El importe viaja como texto justamente para esto: `Number('240.00')` vale
    // 240, y al mostrarlo la pieza pasaria a costar "240 USD".
    await page.goto('/objects/001');

    await expect(page.getByText('240.00 USD')).toBeVisible();
  });

  test('el precio aparece solo en las piezas disponibles', async ({ page }) => {
    await page.goto('/objects/001');
    await expect(page.getByText(/240.00 USD/)).toBeVisible();

    // 003 esta archivada y el servidor sigue mandando su importe: ofrecerlo
    // invitaria a intentar comprar una pieza que ya no esta.
    await page.goto('/objects/003');
    await expect(page.getByText(/USD/)).toHaveCount(0);
  });

  test('la accion cambia segun el estado de la pieza', async ({ page }) => {
    // Lo que esta a la venta se agrega a la bolsa, y es un boton: lo que hace es
    // una escritura contra el servidor, no ir a otra pagina. Antes era un enlace
    // a `/bag` que no agregaba nada. Lo que no se vende solo admite conversacion.
    await page.goto('/objects/001');
    await expect(page.getByRole('button', { name: /agregar a la bolsa/i })).toBeVisible();

    await page.goto('/objects/003');
    await expect(page.getByRole('link', { name: /solicitar un encargo/i })).toBeVisible();
  });

  test('un numero inexistente avisa en vez de romper', async ({ page }) => {
    await page.goto('/objects/999');
    await expect(page.getByText(/no existe ninguna pieza/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /volver a la serie/i })).toBeVisible();
  });

  test('con la API caida distingue el fallo de una pieza que no existe', async ({ page }) => {
    // Son dos desenlaces distintos y el aviso no puede ser el mismo: uno se
    // arregla volviendo a la serie y el otro esperando a que vuelva el servidor.
    const intentos = await romperCatalogo(page);

    await page.goto('/objects/001');

    await expect.poll(intentos).toBeGreaterThan(0);
    await expect(page.getByRole('alert')).toContainText(/no está disponible/i);
    await expect(page.getByText(/no existe ninguna pieza/i)).toHaveCount(0);
  });
});
