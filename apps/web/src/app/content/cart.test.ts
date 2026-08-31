import { describe, expect, it } from 'vitest';
import { ApiError } from '../lib/api';
import {
  amountsFromOrder,
  breakdownRows,
  cartFromPayload,
  classifyFailure,
  discountsFromPayload,
  failureDetail,
  hasAmount,
  itemCount,
  orderFromPayload,
  totalsFromPayload,
} from './cart';

/** Una linea, como la manda `POST /api/cart/items/`. */
function line(overrides: Record<string, unknown> = {}) {
  return {
    id: 3,
    variant_id: 59,
    product_name: 'Tabla Feuoir Clasica',
    variant_name: 'Medida 7.75"',
    sku: 'FEU-TABLA-775',
    options: { Medida: '7.75"' },
    unit_price: '59.00',
    currency: 'USD',
    quantity: 2,
    line_total: '118.00',
    ...overrides,
  };
}

describe('cartFromPayload', () => {
  it('conserva los importes como texto, con sus decimales', () => {
    // Es el motivo por el que viajan como cadena. `Number('118.00')` vale 118, y
    // al volver a texto la linea pasaria a costar "118": los centavos se pierden
    // en el viaje de ida y vuelta.
    const cart = cartFromPayload({
      token: 'k',
      currency: 'USD',
      items: [line({ unit_price: '240.00', line_total: '240.00' })],
      totals: { subtotal: '240.00', total: '281.60' },
    });

    expect(cart.items[0].unitPrice).toBe('240.00');
    expect(cart.items[0].lineTotal).toBe('240.00');
    expect(cart.totals.total).toBe('281.60');
  });

  it('descarta la linea sin identificador, que no se podria editar', () => {
    // Con `id` ausente, los botones de cantidad y de quitar apuntarian a
    // `undefined`: una fila que no se puede tocar es peor que no mostrarla.
    const cart = cartFromPayload({ items: [line(), line({ id: undefined })] });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].id).toBe(3);
  });

  it('lee `requires_tax_id` de la bolsa, que es donde llega primero', () => {
    // El umbral legal es del backend y lo publica el carrito, no solo la orden:
    // por eso el checkout puede pedir el documento antes de recibir un 400.
    expect(cartFromPayload({ requires_tax_id: true }).requiresTaxId).toBe(true);
    expect(cartFromPayload({}).requiresTaxId).toBe(false);
  });

  it('una bolsa vacia es una bolsa, no un fallo', () => {
    const cart = cartFromPayload({ token: 'k', currency: 'USD', items: [], totals: {} });

    expect(cart.items).toEqual([]);
    expect(itemCount(cart)).toBe(0);
  });
});

describe('totalsFromPayload', () => {
  it('no renombra, no descarta y no suma: pasa lo que llego', () => {
    // La regla central. El backend calcula estos importes con la misma funcion
    // que usa la orden para congelarlos; cualquier cuenta hecha aqui solo puede
    // producir un total distinto del que se cobra.
    const totals = totalsFromPayload({
      subtotal: '118.00',
      shipping: '5.00',
      tax: '17.70',
      total: '140.70',
    });

    expect(totals).toEqual({
      subtotal: '118.00',
      shipping: '5.00',
      tax: '17.70',
      total: '140.70',
    });
  });

  it('deja pasar un concepto que el frontend no conoce', () => {
    // Hay descuentos en camino, y van dentro de esa misma funcion del backend.
    // Con una lista cerrada de campos, el descuento quedaria fuera del desglose
    // mientras el total seguiria incluyendolo.
    const totals = totalsFromPayload({
      subtotal: '200.00',
      discount: '-20.00',
      handling: '3.00',
      total: '183.00',
    });

    expect(totals.discount).toBe('-20.00');
    expect(totals.handling).toBe('3.00');
  });

  it('ignora un valor que no es texto, para que la vista no reviente', () => {
    expect(totalsFromPayload({ total: '10.00', roto: { anidado: 1 } })).toEqual({ total: '10.00' });
  });
});

describe('breakdownRows', () => {
  it('deja el total fuera: se dibuja aparte porque es lo que se paga', () => {
    const rows = breakdownRows({ subtotal: '118.00', total: '140.70' });

    expect(rows.map((row) => row.key)).toEqual(['subtotal']);
  });

  it('ordena el desglose de forma legible', () => {
    const rows = breakdownRows({
      tax: '17.70',
      shipping: '5.00',
      subtotal: '118.00',
      discount: '-10.00',
      total: '130.70',
    });

    expect(rows.map((row) => row.key)).toEqual(['subtotal', 'discount', 'shipping', 'tax']);
  });

  it('un concepto desconocido se dibuja igual, al final', () => {
    // Se muestra aunque no tenga nombre traducido: esconder un importe que ya
    // esta dentro del total es peor que leerlo con la clave del servidor.
    const rows = breakdownRows({ subtotal: '100.00', handling: '3.00', total: '103.00' });

    expect(rows.map((row) => row.key)).toEqual(['subtotal', 'handling']);
    expect(rows[1].amount).toBe('3.00');
  });
});

describe('orderFromPayload', () => {
  it('deriva los importes del sufijo, no de una lista escrita a mano', () => {
    // Asi el `discount_amount` que ya manda el backend aparece en la pantalla de
    // la orden sin tocar nada, igual que en la bolsa.
    const order = orderFromPayload({
      order_number: 'FO-2026-E4BE5B5A',
      currency: 'USD',
      subtotal_amount: '118.00',
      shipping_amount: '5.00',
      tax_amount: '17.70',
      discount_amount: '0.00',
      total_amount: '140.70',
      items: [line({ options: undefined, options_snapshot: { Medida: '7.75"' } })],
    });

    expect(order.orderNumber).toBe('FO-2026-E4BE5B5A');
    expect(order.totals).toEqual({
      subtotal: '118.00',
      shipping: '5.00',
      tax: '17.70',
      discount: '0.00',
      total: '140.70',
    });
  });

  it('lee las opciones de la orden aunque lleguen con otro nombre', () => {
    // La bolsa las manda como `options` y la orden como `options_snapshot`: es la
    // unica diferencia de forma, y por eso las dos se dibujan igual.
    const order = orderFromPayload({
      items: [line({ options: undefined, options_snapshot: { Talle: 'M' } })],
    });

    expect(order.items[0].options).toEqual({ Talle: 'M' });
  });

  it('no confunde un campo cualquiera con un importe', () => {
    expect(amountsFromOrder({ order_number: 'FO-1', total_amount: '10.00' })).toEqual({
      total: '10.00',
    });
  });
});

describe('itemCount', () => {
  it('cuenta unidades y no lineas: es lo que espera quien mira la barra', () => {
    const cart = cartFromPayload({ items: [line({ quantity: 2 }), line({ id: 4, quantity: 3 })] });

    expect(itemCount(cart)).toBe(5);
  });

  it('sin bolsa abierta cuenta cero, no falla', () => {
    expect(itemCount(null)).toBe(0);
  });
});

describe('descuentos', () => {
  /**
   * La respuesta real del contrato: un 10% con codigo sobre la mercaderia y un
   * envio gratis automatico. Es el caso que mas facil se dibuja mal.
   */
  const CON_PROMOCIONES = {
    token: 'k',
    currency: 'USD',
    items: [line({ line_total: '118.00', discount_amount: '11.80' })],
    totals: {
      subtotal: '118.00',
      discount: '16.80',
      shipping: '5.00',
      tax: '15.93',
      total: '122.13',
    },
    discount_code: 'VERANO10',
    discounts: [
      {
        code_used: 'VERANO10',
        name: 'Rebajas de temporada',
        scope: 'order',
        amount_applied: '11.80',
      },
      { code_used: '', name: 'Envio gratis sobre 100', scope: 'shipping', amount_applied: '5.00' },
    ],
    requires_tax_id: true,
  };

  it('conserva el bruto y la rebaja por separado, sin restarlos', () => {
    // `line_total` es bruto y `discount_amount` lo que se le quita. Restarlos
    // aqui es como aparece una diferencia de un centavo con lo que se cobra: el
    // reparto y el redondeo ya los hizo el servidor.
    const cart = cartFromPayload(CON_PROMOCIONES);

    expect(cart.items[0].lineTotal).toBe('118.00');
    expect(cart.items[0].discountAmount).toBe('11.80');
  });

  it('el total no se deriva de las otras cuatro claves', () => {
    // 118.00 - 16.80 + 15.93 + 5.00 = 122.13. La relacion existe para leerla, no
    // para recalcularla: se muestra el numero que el servidor va a cobrar.
    const cart = cartFromPayload(CON_PROMOCIONES);

    expect(cart.totals.total).toBe('122.13');
    // Y el impuesto sale del subtotal ya descontado, no del bruto.
    expect(cart.totals.tax).toBe('15.93');
  });

  it('el envio sigue diciendo su importe bruto aunque sea gratis', () => {
    // Ponerlo en cero perderia cuanto costaba enviarlo. Que fue gratis lo dice
    // la promocion de alcance `shipping`, y por eso la lista se muestra.
    const cart = cartFromPayload(CON_PROMOCIONES);

    expect(cart.totals.shipping).toBe('5.00');
    expect(cart.discounts.map((d) => d.scope)).toContain('shipping');
  });

  it('un codigo vacio en la promocion significa automatica', () => {
    // No hay que preguntar de que clase es: la ausencia del codigo ya lo dice.
    const cart = cartFromPayload(CON_PROMOCIONES);

    expect(cart.discounts[0].codeUsed).toBe('VERANO10');
    expect(cart.discounts[1].codeUsed).toBe('');
    expect(cart.discountCode).toBe('VERANO10');
  });

  it('el descuento entra en el desglose en su sitio, entre subtotal y envio', () => {
    const rows = breakdownRows(cartFromPayload(CON_PROMOCIONES).totals);

    expect(rows.map((row) => row.key)).toEqual(['subtotal', 'discount', 'shipping', 'tax']);
  });

  it('marca el descuento como lo que resta, sin tocar sus digitos', () => {
    // El servidor lo manda en positivo y la invariante lo resta. En una columna
    // donde todo lo demas suma, imprimirlo tal cual haria que 240.00 + 24.00 +
    // 5.00 + 32.40 no diera el total, y la cuenta se leeria mal.
    const rows = breakdownRows(cartFromPayload(CON_PROMOCIONES).totals);
    const descuento = rows.find((row) => row.key === 'discount');

    expect(descuento).toMatchObject({ amount: '16.80', subtracted: true });
    expect(rows.find((row) => row.key === 'shipping')?.subtracted).toBe(false);
  });

  it('un descuento en cero no se dibuja con signo', () => {
    const rows = breakdownRows({ subtotal: '240.00', discount: '0.00', total: '281.00' });

    expect(rows.find((row) => row.key === 'discount')?.subtracted).toBe(false);
  });

  it('un concepto nuevo se dibuja sin signo, que es lo correcto por defecto', () => {
    const rows = breakdownRows({ subtotal: '100.00', handling: '3.00', total: '103.00' });

    expect(rows.find((row) => row.key === 'handling')?.subtracted).toBe(false);
  });

  it('la orden trae las promociones congeladas, con la misma forma', () => {
    const order = orderFromPayload({
      order_number: 'FO-1',
      currency: 'USD',
      subtotal_amount: '118.00',
      discount_amount: '16.80',
      total_amount: '122.13',
      items: [],
      discounts: CON_PROMOCIONES.discounts,
    });

    expect(order.totals.discount).toBe('16.80');
    expect(order.discounts).toHaveLength(2);
    expect(order.discounts[1].name).toBe('Envio gratis sobre 100');
  });

  it('descarta una promocion que no dice cuanto descuenta', () => {
    // Una fila que nombra una rebaja sin importe no explica nada del total.
    expect(discountsFromPayload([{ name: 'Sin importe' }])).toEqual([]);
    expect(discountsFromPayload(undefined)).toEqual([]);
  });

  it('sin promociones la bolsa las declara vacias, no ausentes', () => {
    const cart = cartFromPayload({ items: [line()] });

    expect(cart.discounts).toEqual([]);
    expect(cart.discountCode).toBe('');
  });
});

describe('hasAmount', () => {
  it('distingue un importe que dice algo de uno en cero', () => {
    // Decide si se dibuja la anotacion de la linea, no participa de ningun
    // total: el importe que se muestra sigue siendo la cadena del servidor.
    expect(hasAmount('11.80')).toBe(true);
    expect(hasAmount('0.00')).toBe(false);
    expect(hasAmount('')).toBe(false);
  });
});

describe('classifyFailure', () => {
  it('distingue los cuatro desenlaces que documenta el contrato', () => {
    // Cada uno se arregla de otra manera, y un unico "hubo un error" los taparia
    // todos: uno se resuelve solo, otro esperando, otro corrigiendo el pedido.
    expect(classifyFailure(new ApiError('sin red', 0))).toBe('offline');
    expect(classifyFailure(new ApiError('no existe', 404))).toBe('gone');
    expect(classifyFailure(new ApiError('rechazado', 400))).toBe('rejected');
    expect(classifyFailure(new ApiError('demasiadas', 429))).toBe('throttled');
  });

  it('un 500 o algo que no es un ApiError caen en desconocido', () => {
    expect(classifyFailure(new ApiError('roto', 500))).toBe('unknown');
    expect(classifyFailure(new TypeError('otra cosa'))).toBe('unknown');
  });

  it('conserva el motivo que redacto el servidor', () => {
    // Hay rechazos que solo el backend sabe explicar -- que variante no esta a
    // la venta -- y perderlos deja sin saber que corregir.
    const error = new ApiError('rechazado', 400, { detail: 'FEU-GORRA no esta a la venta.' });

    expect(failureDetail(error)).toBe('FEU-GORRA no esta a la venta.');
    expect(failureDetail(new TypeError('otra cosa'))).toBeNull();
  });
});
