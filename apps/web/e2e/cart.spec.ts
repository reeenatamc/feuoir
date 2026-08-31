import { expect, test } from '@playwright/test';
import { servirCatalogo } from './catalog';
import {
  ORDER_NUMBER,
  bolsa,
  bolsaConsumida,
  conTokenGuardado,
  romperBolsa,
  servirBolsa,
  tokenGuardado,
} from './cart';

/**
 * El flujo de compra, de la ficha a la orden.
 *
 * Lo que se comprueba es el contrato con el backend: que la bolsa viva en el
 * servidor y no en memoria del navegador, que los importes se muestren tal como
 * llegan calculados, y que los cuatro desenlaces documentados -- API caida,
 * token consumido, variante rechazada, limite de peticiones -- digan cada uno lo
 * suyo en vez de dejar la pagina en blanco.
 */

test.beforeEach(async ({ page }) => {
  await servirCatalogo(page);
});

test.describe('agregar a la bolsa', () => {
  test('la ficha pone la pieza en la bolsa y el contador lo refleja', async ({ page }) => {
    await servirBolsa(page);
    await page.goto('/objects/001');

    // La barra arranca en cero: sin token guardado no se abre ningun carrito,
    // porque uno por visita seria una fila por cada persona que solo miro.
    await expect(page.getByRole('link', { name: /bolsa 00/i })).toBeVisible();

    await page.getByRole('button', { name: /agregar a la bolsa/i }).click();

    await expect(page.getByRole('status')).toContainText(/está en la bolsa/i);
    // El contador sale del carrito del servidor, no de un estado local.
    await expect(page.getByRole('link', { name: /bolsa 01/i })).toBeVisible();
  });

  test('el contador sobrevive a recargar la pagina', async ({ page }) => {
    // Es la diferencia con el carrito anterior, que vivia en memoria de `App` y
    // se perdia al recargar. El token queda guardado y la bolsa se recupera.
    await servirBolsa(page);
    await page.goto('/objects/001');
    await page.getByRole('button', { name: /agregar a la bolsa/i }).click();
    await expect(page.getByRole('link', { name: /bolsa 01/i })).toBeVisible();

    await page.reload();

    await expect(page.getByRole('link', { name: /bolsa 01/i })).toBeVisible();
    expect(await tokenGuardado(page)).not.toBeNull();
  });

  test('una pieza archivada no ofrece el boton, ofrece el encargo', async ({ page }) => {
    await servirBolsa(page);
    await page.goto('/objects/003');

    await expect(page.getByRole('link', { name: /solicitar un encargo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /agregar a la bolsa/i })).toHaveCount(0);
  });

  test('una variante rechazada muestra el motivo que dio el servidor', async ({ page }) => {
    // Puede pasar entre que se abre la ficha y se pulsa el boton, y el motivo
    // exacto solo lo sabe el backend.
    await servirBolsa(page);
    await page.route('**/api/cart/items/', (route) =>
      route.fulfill({ status: 400, json: { detail: 'FEU-S001-O001 no esta a la venta.' } })
    );

    await page.goto('/objects/001');
    await page.getByRole('button', { name: /agregar a la bolsa/i }).click();

    const aviso = page.getByRole('alert');
    await expect(aviso).toContainText(/no aceptó la operación/i);
    await expect(aviso).toContainText('FEU-S001-O001 no esta a la venta.');
    await expect(page.getByRole('link', { name: /bolsa 00/i })).toBeVisible();
  });

  test('el limite de peticiones se cuenta como lo que es', async ({ page }) => {
    // Hay throttling puesto: 120/min anonimo. Mostrarlo como un error generico
    // invita a reintentar en vano.
    await servirBolsa(page);
    await page.route('**/api/cart/items/', (route) =>
      route.fulfill({ status: 429, json: { detail: 'Request was throttled.' } })
    );

    await page.goto('/objects/001');
    await page.getByRole('button', { name: /agregar a la bolsa/i }).click();

    await expect(page.getByRole('alert')).toContainText(/demasiadas peticiones/i);
  });
});

test.describe('la bolsa', () => {
  test('muestra las lineas y los importes que mando el servidor', async ({ page }) => {
    await conTokenGuardado(page);
    await servirBolsa(page, { existe: true });

    await page.goto('/bag');

    await expect(page.getByRole('heading', { level: 1, name: 'Bolsa' })).toBeVisible();
    await expect(page.getByText('Ceniza', { exact: true })).toBeVisible();
    await expect(page.getByText('FEU-S001-O001')).toBeVisible();

    // El total llega calculado y se muestra entero, con las cinco claves que
    // ahora declara el contrato.
    await expect(page.getByText('281.00 USD', { exact: true })).toBeVisible();
    for (const concepto of ['Subtotal', 'Descuento', 'Envío', 'Impuestos', 'Total']) {
      await expect(page.getByText(concepto, { exact: true })).toBeVisible();
    }
  });

  test('un concepto que el frontend no sabe nombrar se muestra igual', async ({ page }) => {
    // Esconderlo seria callar un importe que ya esta dentro del total.
    await conTokenGuardado(page);
    await servirBolsa(page, { existe: true });
    await page.route('**/api/cart/', (route) =>
      route.fulfill({
        json: {
          token: 'k',
          currency: 'USD',
          items: [
            {
              id: 3,
              product_name: 'Ceniza',
              sku: 'FEU-S001-O001',
              options: {},
              unit_price: '240.00',
              quantity: 1,
              line_total: '240.00',
            },
          ],
          totals: { subtotal: '240.00', recargo_insolito: '7.00', total: '247.00' },
          requires_tax_id: false,
        },
      })
    );

    await page.goto('/bag');

    await expect(page.getByText('recargo_insolito')).toBeVisible();
    await expect(page.getByText('7.00 USD', { exact: true })).toBeVisible();
  });

  test('el precio conserva los decimales que mando el servidor', async ({ page }) => {
    // Los importes viajan como texto justamente para esto: `Number('240.00')`
    // vale 240, y la pieza pasaria a costar "240 USD".
    await conTokenGuardado(page);
    await servirBolsa(page, { existe: true });

    await page.goto('/bag');

    await expect(page.getByText('240.00 USD').first()).toBeVisible();
  });

  test('sumar una unidad pide al servidor los importes nuevos', async ({ page }) => {
    await conTokenGuardado(page);
    await servirBolsa(page, { existe: true });
    await page.goto('/bag');
    await expect(page.getByText('281.00 USD')).toBeVisible();

    await page.getByRole('button', { name: /sumar una unidad/i }).click();

    // El total nuevo es el del servidor, no el anterior multiplicado por dos:
    // 281.00 x 2 daria 562.00, y lo que se cobra es 557.00 porque el envio no
    // se duplica. Es la comprobacion mas directa de que no se recalcula nada.
    await expect(page.getByText('557.00 USD')).toBeVisible();
    await expect(page.getByRole('link', { name: /bolsa 02/i })).toBeVisible();
  });

  test('quitar la linea deja la bolsa vacia y lo dice', async ({ page }) => {
    await conTokenGuardado(page);
    await servirBolsa(page, { existe: true });
    await page.goto('/bag');

    await page.getByRole('button', { name: /^quitar$/i }).click();

    await expect(page.getByText(/todavía no hay ninguna pieza/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /bolsa 00/i })).toBeVisible();
  });

  test('avisa del documento desde la bolsa, no al confirmar', async ({ page }) => {
    // El umbral legal es del backend y llega en `requires_tax_id` desde el
    // carrito: es el momento util para pedirlo, y no una sorpresa al final.
    await conTokenGuardado(page);
    await servirBolsa(page, { existe: true });

    await page.goto('/bag');

    await expect(page.getByText(/la factura necesita el nombre y el documento/i)).toBeVisible();
  });

  test('un cupon baja el total y dice que promocion lo bajo', async ({ page }) => {
    await conTokenGuardado(page);
    await servirBolsa(page, { existe: true });
    await page.goto('/bag');
    await expect(page.getByText('281.00 USD')).toBeVisible();

    await page.getByLabel(/código de descuento/i).fill('verano10');
    await page.getByRole('button', { name: /^aplicar$/i }).click();

    // El total es el del servidor. Sumar los conceptos visibles -- 240.00 mas
    // 5.00 de envio mas 32.40 de impuesto -- daria 277.40, y se cobra 248.40.
    await expect(page.getByText('248.40 USD')).toBeVisible();
    // Y el descuento se lee como lo que resta: sin el signo, la columna daria
    // 277.40 a la vista y el cobro seria 248.40.
    await expect(page.getByText('−29.00 USD', { exact: true })).toBeVisible();

    // Y se ve por que bajo, no solo cuanto.
    await expect(page.getByText('Rebajas de temporada')).toBeVisible();
    await expect(page.getByText(/envio gratis sobre 100/i)).toBeVisible();
  });

  test('con envio gratis el envio sigue diciendo su importe bruto', async ({ page }) => {
    // No es un error: el envio se cobra y la promocion lo compensa. Ponerlo en
    // cero perderia cuanto costaba enviarlo, y por eso lo que explica que fue
    // gratis es la promocion de alcance `shipping`, no un cinco convertido en cero.
    await conTokenGuardado(page);
    await servirBolsa(page, { existe: true });
    await page.goto('/bag');
    await page.getByLabel(/código de descuento/i).fill('VERANO10');
    await page.getByRole('button', { name: /^aplicar$/i }).click();
    await expect(page.getByText('248.40 USD')).toBeVisible();

    // El envio bruto sigue en la lista de importes...
    await expect(page.getByText('5.00 USD', { exact: true })).toBeVisible();
    // ...y al lado, la promocion que lo compensa entera.
    await expect(page.getByText(/envio gratis sobre 100/i)).toBeVisible();
    await expect(page.getByText('−5.00 USD', { exact: true })).toBeVisible();
  });

  test('la linea muestra el bruto y su rebaja, sin restarlos', async ({ page }) => {
    // `line_total` es bruto: lo que se cobra por la linea es la resta de los
    // dos, y esa resta la hace el servidor, no la pantalla.
    await conTokenGuardado(page);
    await servirBolsa(page, { existe: true });
    await page.goto('/bag');
    await page.getByLabel(/código de descuento/i).fill('VERANO10');
    await page.getByRole('button', { name: /^aplicar$/i }).click();

    const linea = page.getByRole('listitem').first();
    await expect(linea).toContainText('240.00 USD');
    await expect(linea).toContainText('24.00');
  });

  test('un codigo que no corresponde se rechaza con el motivo del servidor', async ({ page }) => {
    // Aceptarlo mostraria un cupon aplicado y un total sin cambios.
    await conTokenGuardado(page);
    await servirBolsa(page, { existe: true });
    await page.goto('/bag');

    await page.getByLabel(/código de descuento/i).fill('NOEXISTE');
    await page.getByRole('button', { name: /^aplicar$/i }).click();

    await expect(page.getByText(/NOEXISTE no corresponde a esta compra/i)).toBeVisible();
    // Y el total no se movio.
    await expect(page.getByText('281.00 USD')).toBeVisible();
  });

  test('el cupon se puede quitar y el total vuelve', async ({ page }) => {
    await conTokenGuardado(page);
    await servirBolsa(page, { existe: true });
    await page.goto('/bag');
    await page.getByLabel(/código de descuento/i).fill('VERANO10');
    await page.getByRole('button', { name: /^aplicar$/i }).click();
    await expect(page.getByText('248.40 USD')).toBeVisible();

    await page.getByRole('button', { name: /quitar el cupón/i }).click();

    await expect(page.getByText('281.00 USD')).toBeVisible();
    await expect(page.getByText('Rebajas de temporada')).toHaveCount(0);
  });

  test('con la API caida dice algo en vez de quedarse en blanco', async ({ page }) => {
    // Una pagina vacia se lee como "no tienes nada", que es otra afirmacion.
    await conTokenGuardado(page);
    const intentos = await romperBolsa(page);

    await page.goto('/bag');

    await expect.poll(intentos).toBeGreaterThan(0);
    await expect(page.getByRole('alert')).toContainText(/no se pudo contactar el servidor/i);
    // Y la pagina sigue siendo la pagina.
    await expect(page.getByRole('heading', { level: 1, name: 'Bolsa' })).toBeVisible();
  });

  test('el token consumido no es un error: la bolsa arranca vacia', async ({ page }) => {
    // Es lo que queda despues de comprar, y pasa en cada visita siguiente si el
    // token no se borra. Se distingue de un fallo a proposito.
    await conTokenGuardado(page);
    const intentos = await bolsaConsumida(page);

    await page.goto('/bag');

    await expect.poll(intentos).toBeGreaterThan(0);
    await expect(page.getByText(/todavía no hay ninguna pieza/i)).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    // Y el token muerto se borra, o el siguiente GET fallaria para siempre.
    await expect.poll(() => tokenGuardado(page)).toBeNull();
  });
});

test.describe('checkout', () => {
  /** Deja la bolsa con una pieza y abre el formulario. */
  async function abrirFormulario(page: import('@playwright/test').Page) {
    await conTokenGuardado(page);
    await servirBolsa(page, { existe: true });
    await page.goto('/bag');
    await page.getByRole('button', { name: /continuar con la compra/i }).click();
  }

  /** Rellena lo minimo que el servidor acepta. */
  async function rellenar(page: import('@playwright/test').Page) {
    await page.getByLabel('Nombre', { exact: true }).fill('Ana Diaz');
    await page.getByLabel('Correo').fill('ana@example.com');
    await page.getByLabel('Dirección').fill('Av. Amazonas N34-100');
    await page.getByLabel('Ciudad').fill('Quito');
    await page.getByLabel('País').fill('EC');
  }

  test('pide la direccion de facturacion cuando la bolsa lo exige', async ({ page }) => {
    await abrirFormulario(page);

    await expect(page.getByText('Facturación')).toBeVisible();
    await expect(page.getByLabel('Número de documento')).toBeVisible();
    await expect(page.getByLabel('Tipo de documento')).toBeVisible();
  });

  test('por debajo del umbral no pide documento: es consumidor final', async ({ page }) => {
    // Consumidor final es la **ausencia** de direccion de facturacion, no un
    // tipo de documento mas. Si la bolsa no lo exige, el formulario no lo pide y
    // el cuerpo del checkout no lleva `billing_address`.
    await conTokenGuardado(page);
    await servirBolsa(page, { existe: true });
    await page.route('**/api/cart/', (route) =>
      route.fulfill({ json: { ...bolsa(1), requires_tax_id: false } })
    );

    await page.goto('/bag');
    await expect(page.getByText(/la factura necesita el nombre/i)).toHaveCount(0);
    await page.getByRole('button', { name: /continuar con la compra/i }).click();

    await expect(page.getByText('Facturación')).toHaveCount(0);
    await expect(page.getByLabel('Número de documento')).toHaveCount(0);
  });

  test('no deja confirmar sin lo que el servidor necesita', async ({ page }) => {
    await abrirFormulario(page);

    await page.getByRole('button', { name: /confirmar la compra/i }).click();

    await expect(page.getByText('Falta el nombre.', { exact: true })).toBeVisible();
    await expect(page.getByText('Falta la dirección.', { exact: true })).toBeVisible();
    // Y no se llego a pedir la orden: seguimos en el formulario.
    await expect(page.getByRole('button', { name: /confirmar la compra/i })).toBeVisible();
  });

  test('el recorrido completo termina en la orden y su enlace de pago', async ({ page }) => {
    await abrirFormulario(page);
    await rellenar(page);
    await page.getByLabel('Nombre en la factura').fill('Ana Diaz Torres');
    await page.getByLabel('Número de documento').fill('1791234567001');

    await page.getByRole('button', { name: /confirmar la compra/i }).click();

    await expect(page.getByRole('heading', { level: 1, name: /orden creada/i })).toBeVisible();
    await expect(page.getByText(ORDER_NUMBER)).toBeVisible();
    // Los importes de la orden se dibujan con el mismo desglose que la bolsa,
    // aunque el servidor los mande planos (`total_amount`) y no anidados.
    await expect(page.getByText('557.00 USD')).toBeVisible();

    // Crear la orden no la cobra: el pago es un paso aparte y se ve como tal.
    const pagar = page.getByRole('link', { name: /pagar por whatsapp/i });
    await expect(pagar).toBeVisible();
    await expect(pagar).toHaveAttribute('href', new RegExp(`wa\\.me/.*${ORDER_NUMBER}`));
  });

  test('despues de comprar se borra el token y la bolsa vuelve a cero', async ({ page }) => {
    // El servidor consume el carrito al convertirlo. Sin este borrado, el
    // siguiente GET /api/cart/ responderia 404 para siempre en este navegador.
    await abrirFormulario(page);
    await rellenar(page);
    await page.getByLabel('Nombre en la factura').fill('Ana Diaz Torres');
    await page.getByLabel('Número de documento').fill('1791234567001');
    await page.getByRole('button', { name: /confirmar la compra/i }).click();
    await expect(page.getByText(ORDER_NUMBER)).toBeVisible();
    // Se espera a que la pantalla termine de asentarse -- el intento de pago es
    // un segundo viaje -- antes de navegar: irse con esa peticion en vuelo deja
    // la comprobacion corriendo contra una pagina a medio montar.
    await expect(page.getByRole('link', { name: /pagar por whatsapp/i })).toBeVisible();

    await expect.poll(() => tokenGuardado(page)).toBeNull();
    await expect(page.getByRole('link', { name: /bolsa 00/i })).toBeVisible();

    // Y al volver a la bolsa esta vacia, sin ningun aviso de fallo.
    await page.goto('/bag');
    await expect(page.getByText(/todavía no hay ninguna pieza/i)).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('un carrito vacio se rechaza y la bolsa sobrevive', async ({ page }) => {
    await abrirFormulario(page);
    await rellenar(page);
    await page.getByLabel('Nombre en la factura').fill('Ana Diaz Torres');
    await page.getByLabel('Número de documento').fill('1791234567001');
    await page.route('**/api/cart/checkout/', (route) =>
      route.fulfill({ status: 400, json: { detail: 'El carrito no tiene lineas.' } })
    );

    await page.getByRole('button', { name: /confirmar la compra/i }).click();

    const aviso = page.getByRole('alert').filter({ hasText: /no aceptó la operación/i });
    await expect(aviso).toContainText('El carrito no tiene lineas.');
    // El rechazo revierte todo: el token sigue sirviendo.
    expect(await tokenGuardado(page)).not.toBeNull();
  });
});
