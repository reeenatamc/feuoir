/**
 * El formulario del checkout: su forma, lo que exige y como se traduce al
 * cuerpo que espera `POST /api/cart/checkout/`.
 *
 * Mismo reparto que `content/commissions.ts`: aqui la logica pura, en el
 * componente el dibujo. Lo que se gana es poder comprobar sin montar nada que el
 * documento se pide cuando la bolsa dice que hace falta y no cuando no, y que el
 * cuerpo que sale lleva lo que el contrato declara.
 */

/**
 * Documentos con los que se puede emitir una factura en Ecuador.
 *
 * No incluye "consumidor final": el contrato es explicito en que consumidor
 * final es la **ausencia** de direccion de facturacion, no un tipo de documento
 * mas. Modelarlo como un valor obligaria despues a distinguir entre "sin
 * documento" y "documento de consumidor final", que son lo mismo dicho de dos
 * formas.
 */
export const TAX_ID_KINDS = ['cedula', 'ruc', 'passport'] as const;
export type TaxIdKind = (typeof TAX_ID_KINDS)[number];

export interface CheckoutForm {
  email: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  /** Codigo ISO de dos letras: la columna del backend mide exactamente dos. */
  country: string;
  /**
   * Titular de la factura, que no siempre es quien recibe el paquete: se compra
   * a nombre de una empresa y se envia a una casa.
   */
  billingName: string;
  taxId: string;
  taxIdKind: TaxIdKind;
}

export const EMPTY_CHECKOUT: CheckoutForm = {
  email: '',
  name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  // Sin pais por defecto: elegir uno seria decidir desde donde compra la gente,
  // y un valor precargado que nadie mira termina enviando piezas al pais que
  // adivino el frontend.
  country: '',
  billingName: '',
  taxId: '',
  taxIdKind: 'cedula',
};

/** Campos sin los que la orden no se puede crear. */
export type CheckoutField = 'email' | 'name' | 'line1' | 'city' | 'country' | 'billingName' | 'taxId';

/**
 * Comprobacion de forma del correo, no de existencia. Deliberadamente laxa, por
 * el mismo motivo que en los encargos: las expresiones estrictas rechazan
 * direcciones validas y lo unico que confirma un correo es escribirle.
 */
function isEmailShaped(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Lo que falta para poder confirmar.
 *
 * `requiresTaxId` **no se calcula aqui**: llega de la bolsa, porque el umbral
 * legal es del backend. Escribir "50 dolares" en esta funcion crearia una
 * segunda copia de una regla que puede cambiar por ley, y la copia del
 * formulario seria la que se aplica.
 *
 * Del documento solo se exige que este. Su longitud -- diez digitos la cedula,
 * trece el RUC -- la comprueba el servidor y su `400` lo dice con precision:
 * repetir esos numeros aqui es el mismo error de tener la regla en dos sitios,
 * en pequeño.
 */
export function validate(form: CheckoutForm, requiresTaxId: boolean): CheckoutField[] {
  const missing: CheckoutField[] = [];

  if (!isEmailShaped(form.email)) missing.push('email');
  if (!form.name.trim()) missing.push('name');
  if (!form.line1.trim()) missing.push('line1');
  if (!form.city.trim()) missing.push('city');
  // Dos letras exactas: la columna las mide asi, y un "Ecuador" escrito entero
  // se guardaria como "Ec", que es un pais que no existe.
  if (!/^[A-Za-z]{2}$/.test(form.country.trim())) missing.push('country');

  if (requiresTaxId) {
    if (!form.billingName.trim()) missing.push('billingName');
    if (!form.taxId.trim()) missing.push('taxId');
  }

  return missing;
}

/**
 * El cuerpo de `POST /api/cart/checkout/`.
 *
 * Sin `lines`: las lineas salen del carrito del token, y mandarlas seria decirle
 * al servidor lo que ya sabe. Sin importes tampoco: el contrato es explicito en
 * que los precios no se aceptan del cliente.
 */
export function checkoutPayload(form: CheckoutForm, requiresTaxId: boolean): Record<string, unknown> {
  const name = form.name.trim();
  const phone = form.phone.trim();
  const line1 = form.line1.trim();
  const city = form.city.trim();
  const country = form.country.trim().toUpperCase();

  const payload: Record<string, unknown> = {
    customer_email: form.email.trim(),
    customer_name: name,
    customer_phone: phone,
    shipping_address: {
      full_name: name,
      line1,
      line2: form.line2.trim(),
      city,
      state: form.state.trim(),
      postal_code: form.postalCode.trim(),
      country,
      phone,
    },
  };

  // Consumidor final es la ausencia de esta clave. Cuando la bolsa no exige
  // documento, no se manda una direccion de facturacion a medias: hay
  // constraints en la base que las rechazan, y con razon.
  if (requiresTaxId) {
    payload.billing_address = {
      // La direccion de la factura reutiliza la del envio. Lo que la ley pide y
      // puede diferir es el titular y su documento, y eso si se pregunta.
      full_name: form.billingName.trim(),
      line1,
      city,
      country,
      tax_id: form.taxId.trim(),
      tax_id_kind: form.taxIdKind,
    };
  }

  return payload;
}
