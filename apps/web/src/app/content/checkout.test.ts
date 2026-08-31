import { describe, expect, it } from 'vitest';
import { EMPTY_CHECKOUT, checkoutPayload, validate } from './checkout';
import type { CheckoutForm } from './checkout';

/** Un formulario completo, para partir de ahi y romper un campo por prueba. */
const FILLED: CheckoutForm = {
  email: 'ana@example.com',
  name: 'Ana Diaz',
  phone: '593991112233',
  line1: 'Av. Amazonas N34-100',
  line2: 'Depto 4B',
  city: 'Quito',
  state: 'Pichincha',
  postalCode: '170135',
  country: 'EC',
  billingName: 'Ana Diaz Torres',
  taxId: '1791234567001',
  taxIdKind: 'ruc',
};

describe('validate', () => {
  it('un formulario completo no reclama nada', () => {
    expect(validate(FILLED, true)).toEqual([]);
  });

  it('exige lo que hace falta para poder enviar', () => {
    expect(validate(EMPTY_CHECKOUT, false).sort()).toEqual(['city', 'country', 'email', 'line1', 'name']);
  });

  it('pide el documento solo cuando la bolsa dice que hace falta', () => {
    // El umbral legal es del backend y llega en `requires_tax_id`. Escribir "50
    // dolares" aqui crearia una segunda copia de una regla que cambia por ley, y
    // la del formulario seria la que se aplica.
    const sinDocumento = { ...FILLED, billingName: '', taxId: '' };

    expect(validate(sinDocumento, false)).toEqual([]);
    expect(validate(sinDocumento, true).sort()).toEqual(['billingName', 'taxId']);
  });

  it('el pais va en codigo de dos letras', () => {
    // La columna del backend mide exactamente dos: un "Ecuador" escrito entero
    // se guardaria como "Ec", que es un pais que no existe.
    expect(validate({ ...FILLED, country: 'Ecuador' }, false)).toEqual(['country']);
    expect(validate({ ...FILLED, country: 'ec' }, false)).toEqual([]);
  });

  it('no comprueba la longitud del documento: esa regla es del servidor', () => {
    // El backend contesta 400 diciendo cuantos digitos esperaba. Repetir aqui
    // que la cedula tiene diez es el mismo error de tener la regla en dos sitios.
    expect(validate({ ...FILLED, taxIdKind: 'cedula', taxId: '123' }, true)).toEqual([]);
  });

  it('atrapa el error de tecleo evidente en el correo', () => {
    expect(validate({ ...FILLED, email: 'ana@example' }, false)).toEqual(['email']);
  });
});

describe('checkoutPayload', () => {
  it('no manda lineas ni importes: los pone el servidor', () => {
    // Las lineas salen del carrito del token, y los precios se leen del catalogo.
    const payload = checkoutPayload(FILLED, false);

    expect(payload.lines).toBeUndefined();
    expect(payload.total_amount).toBeUndefined();
  });

  it('arma la direccion de envio con el nombre de quien compra', () => {
    const payload = checkoutPayload(FILLED, false);

    expect(payload.shipping_address).toEqual({
      full_name: 'Ana Diaz',
      line1: 'Av. Amazonas N34-100',
      line2: 'Depto 4B',
      city: 'Quito',
      state: 'Pichincha',
      postal_code: '170135',
      country: 'EC',
      phone: '593991112233',
    });
  });

  it('sin documento requerido no manda direccion de facturacion', () => {
    // Consumidor final es la ausencia de la clave, no un tipo de documento mas.
    // Mandarla a medias la rechazarian las constraints de la base, con razon.
    expect(checkoutPayload(FILLED, false).billing_address).toBeUndefined();
  });

  it('con documento requerido factura a la misma direccion, con su titular', () => {
    // Lo que la ley pide y puede diferir es quien recibe la factura y su
    // documento; la calle es la misma y no se pregunta dos veces.
    expect(checkoutPayload(FILLED, true).billing_address).toEqual({
      full_name: 'Ana Diaz Torres',
      line1: 'Av. Amazonas N34-100',
      city: 'Quito',
      country: 'EC',
      tax_id: '1791234567001',
      tax_id_kind: 'ruc',
    });
  });

  it('normaliza el pais a mayusculas y recorta los espacios', () => {
    const payload = checkoutPayload({ ...FILLED, country: ' ec ', city: '  Quito  ' }, false);

    expect(payload.shipping_address).toMatchObject({ country: 'EC', city: 'Quito' });
  });
});
