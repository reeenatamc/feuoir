import { ApiError } from '../lib/api';

/**
 * La bolsa y la orden, tal como las devuelve la API.
 *
 * Mismo reparto que `content/objects.ts`: aqui vive la forma y la traduccion del
 * JSON, no el estado ni las peticiones. Lo que se gana es que las reglas que de
 * verdad importan -- que los importes no se recalculen, que un concepto nuevo
 * aparezca solo -- se puedan probar sin montar React ni tocar la red.
 */

/**
 * Una linea, de la bolsa o de la orden.
 *
 * Es un solo tipo para las dos porque el contrato lo dice explicitamente: los
 * `items[]` de la orden tienen la misma forma que los de la bolsa, para que se
 * dibujen con el mismo componente. Lo que cambia es de donde salen los datos --
 * la bolsa lee la variante viva, la orden una copia congelada -- y esa
 * diferencia no se ve desde la vista.
 */
export interface CartLine {
  id: number;
  productName: string;
  /** Nombre de la variante (`Talle M / Oxido`). Vacio si no la nombra. */
  variantName: string;
  sku: string;
  /** Opciones de la variante. La orden las manda como `options_snapshot`. */
  options: Record<string, string>;
  /**
   * Precio unitario **como texto**, tal cual llego: `"59.00"`.
   *
   * No se convierte a `number` para mostrarlo. `Number('240.00')` vale 240 y al
   * volver a texto la pieza pasa a costar "240": los centavos se pierden en el
   * viaje de ida y vuelta.
   */
  unitPrice: string;
  quantity: number;
  /**
   * Importe **bruto** de la linea, sin descuentos.
   *
   * No es lo que se cobra por ella: hay que restarle `discountAmount`. Los dos
   * viajan por separado porque el neto se puede calcular y el bruto no se puede
   * reconstruir, y el bruto hace falta para una devolucion parcial.
   *
   * La resta no se hace aqui: se muestran los dos numeros del servidor. Restar
   * en JavaScript sobre importes decimales es exactamente como aparece una
   * diferencia de un centavo entre lo que dice la pantalla y lo que se cobra.
   */
  lineTotal: string;
  /** Lo que se descuenta de esta linea. `"0.00"` cuando no hay promocion. */
  discountAmount: string;
}

/**
 * Una promocion aplicada, con la misma forma en el carrito y en la orden.
 *
 * Existe para poder decir **por que** bajo el total. `totals.discount` dice
 * cuanto, y eso solo no explica que el envio salio gratis: `shipping` sigue
 * diciendo su importe bruto porque el envio se cobra y la promocion lo compensa,
 * y sin esta lista la pantalla mostraria un cargo de envio que nadie paga.
 */
export interface CartDiscount {
  /** Vacio cuando la promocion es automatica y nadie escribio un codigo. */
  codeUsed: string;
  name: string;
  /** `order`, `shipping`, `series`, `category`... lo decide el servidor. */
  scope: string;
  amountApplied: string;
}

/**
 * Los importes, exactamente como los mando el servidor.
 *
 * Es un mapa abierto y no un objeto con campos fijos, y es deliberado. El
 * backend calcula estos importes con la misma funcion que usa la orden para
 * congelar los suyos, justamente para que la bolsa y el cobro no puedan
 * discrepar. Si el frontend declarara `{subtotal, shipping, tax, total}` y el
 * backend sumara un descuento dentro de esa funcion, el cliente mostraria un
 * desglose al que le falta una linea -- y sumar por su cuenta para "arreglarlo"
 * es exactamente como se llega a mostrar un total y cobrar otro.
 *
 * Aqui no se suma nada: se lee el conjunto y se dibuja entero.
 */
export type CartTotals = Readonly<Record<string, string>>;

export interface Cart {
  token: string;
  /**
   * Moneda de la bolsa. La fija la tienda al abrirla y no cambia despues.
   *
   * Se muestra tal cual llega, sin validarla contra la lista de monedas que el
   * catalogo conoce: alli callar el precio es una degradacion aceptable, aqui
   * significaria no poder mostrar lo que la persona esta a punto de pagar.
   */
  currency: string;
  items: CartLine[];
  totals: CartTotals;
  /** El cupon activo, ya normalizado por el servidor. Vacio si no hay ninguno. */
  discountCode: string;
  /** Las promociones aplicadas, con codigo o automaticas. */
  discounts: CartDiscount[];
  /**
   * Si el importe ya no se puede facturar a consumidor final.
   *
   * Lo publica la bolsa y no solo la orden, y ese es el punto: el umbral legal
   * es del backend, y saberlo antes del checkout permite pedir el documento en
   * el momento util en vez de descubrirlo con un `400` al confirmar.
   *
   * Se decide sobre el total **ya descontado**, asi que un cupon puede hacer que
   * una compra deje de cruzar el umbral. Otra razon para leerlo y no calcularlo.
   */
  requiresTaxId: boolean;
}

export interface Order {
  /** Identificador publico: `FO-2026-E4BE5B5A`. Es el que va en la URL. */
  orderNumber: string;
  currency: string;
  items: CartLine[];
  /**
   * Los importes congelados, con la misma forma que los de la bolsa.
   *
   * La orden los manda planos (`total_amount`) y la bolsa anidados (`totals`).
   * Se igualan aqui para que las dos pantallas usen el mismo desglose y para que
   * un concepto nuevo aparezca en las dos sin tocar ninguna vista.
   */
  totals: CartTotals;
  /** Copia congelada de las promociones, no una referencia a las reglas. */
  discounts: CartDiscount[];
  requiresTaxId: boolean;
}

/** La bolsa tal como llega en el JSON, en snake_case y sin garantias. */
export interface CartPayload {
  token?: string;
  currency?: string;
  items?: LinePayload[];
  totals?: Record<string, unknown>;
  discount_code?: string;
  discounts?: DiscountPayload[];
  requires_tax_id?: boolean;
}

export interface DiscountPayload {
  code_used?: string;
  name?: string;
  scope?: string;
  amount_applied?: string;
}

export interface LinePayload {
  id?: number;
  product_name?: string;
  variant_name?: string;
  sku?: string;
  options?: Record<string, unknown>;
  options_snapshot?: Record<string, unknown>;
  unit_price?: string;
  quantity?: number;
  line_total?: string;
  discount_amount?: string;
}

export interface OrderPayload {
  order_number?: string;
  currency?: string;
  items?: LinePayload[];
  requires_tax_id?: boolean;
  /** El resto son los `*_amount`, que se leen sin nombrarlos de a uno. */
  [key: string]: unknown;
}

/** Texto o cadena vacia: un importe ausente no se inventa como cero. */
function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function options(raw: Record<string, unknown> | undefined): Record<string, string> {
  const entries = Object.entries(raw ?? {}).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string'
  );
  return Object.fromEntries(entries);
}

/**
 * Una linea, o `null` si no trae lo minimo para dibujarla.
 *
 * El `id` es lo minimo: es con lo que se cambia la cantidad y se quita la linea,
 * y una fila con botones que apuntan a `undefined` es peor que no mostrarla.
 */
export function lineFromPayload(raw: LinePayload): CartLine | null {
  if (typeof raw.id !== 'number') return null;

  return {
    id: raw.id,
    productName: text(raw.product_name),
    variantName: text(raw.variant_name),
    sku: text(raw.sku),
    // La bolsa las manda como `options` y la orden como `options_snapshot`: es
    // la unica diferencia de forma entre las dos, y se absorbe aqui.
    options: options(raw.options ?? raw.options_snapshot),
    unitPrice: text(raw.unit_price),
    quantity: typeof raw.quantity === 'number' ? raw.quantity : 1,
    lineTotal: text(raw.line_total),
    discountAmount: text(raw.discount_amount),
  };
}

/**
 * Las promociones aplicadas.
 *
 * Se descarta la que no dice cuanto descuenta: una fila que nombra una rebaja
 * sin importe no explica nada de lo que bajo el total.
 */
export function discountsFromPayload(raw: DiscountPayload[] | undefined): CartDiscount[] {
  return (raw ?? [])
    .filter((entry) => typeof entry.amount_applied === 'string')
    .map((entry) => ({
      codeUsed: text(entry.code_used),
      name: text(entry.name),
      scope: text(entry.scope),
      amountApplied: text(entry.amount_applied),
    }));
}

function linesFromPayload(raw: LinePayload[] | undefined): CartLine[] {
  return (raw ?? []).map(lineFromPayload).filter((line): line is CartLine => line !== null);
}

/**
 * Los importes, filtrados a los que son texto y en el orden en que llegaron.
 *
 * El filtro no es una validacion de negocio: es lo que impide que un valor con
 * otra forma llegue a la vista y la rompa al pintarlo. Ninguna clave se
 * renombra, se descarta ni se suma.
 */
export function totalsFromPayload(raw: Record<string, unknown> | undefined): CartTotals {
  const entries = Object.entries(raw ?? {}).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string'
  );
  return Object.fromEntries(entries);
}

export function cartFromPayload(raw: CartPayload): Cart {
  return {
    token: text(raw.token),
    currency: text(raw.currency),
    items: linesFromPayload(raw.items),
    totals: totalsFromPayload(raw.totals),
    discountCode: text(raw.discount_code),
    discounts: discountsFromPayload(raw.discounts),
    requiresTaxId: raw.requires_tax_id === true,
  };
}

/**
 * Los `*_amount` de la orden, con la misma forma que los `totals` de la bolsa.
 *
 * Se derivan del sufijo en vez de listarlos: asi el `discount_amount` que hoy ya
 * manda el backend, y cualquier concepto que se agregue mañana, aparecen en la
 * pantalla de la orden sin tocar esta funcion ni la vista.
 */
export function amountsFromOrder(raw: OrderPayload): CartTotals {
  const entries = Object.entries(raw)
    .filter((entry): entry is [string, string] => entry[0].endsWith('_amount') && typeof entry[1] === 'string')
    .map(([key, value]) => [key.slice(0, -'_amount'.length), value] as const);

  return Object.fromEntries(entries);
}

export function orderFromPayload(raw: OrderPayload): Order {
  return {
    orderNumber: text(raw.order_number),
    currency: text(raw.currency),
    items: linesFromPayload(raw.items as LinePayload[] | undefined),
    totals: amountsFromOrder(raw),
    discounts: discountsFromPayload(raw.discounts as DiscountPayload[] | undefined),
    requiresTaxId: raw.requires_tax_id === true,
  };
}

/**
 * Orden de lectura del desglose.
 *
 * Es una preferencia de presentacion, no la lista de lo que existe: lo que llega
 * y no esta aqui se dibuja igual, al final. La diferencia importa -- una lista
 * cerrada esconderia un concepto nuevo, y el total seguiria incluyendolo.
 */
const BREAKDOWN_ORDER = ['subtotal', 'discount', 'shipping', 'tax'];

/**
 * Conceptos que restan del total.
 *
 * El servidor manda el descuento en positivo (`"24.00"`) y la invariante es
 * `total = subtotal - discount + tax + shipping`. En una columna donde todo lo
 * demas suma, imprimirlo tal cual se lee como si sumara: 240.00 + 24.00 + 5.00 +
 * 32.40 no da 253.40, y quien mira concluye que la cuenta esta mal.
 *
 * El signo es **solo presentacion**: el importe que se dibuja siguen siendo los
 * digitos exactos del servidor, y de aqui no sale ningun total.
 */
const SUBTRACTED = new Set(['discount']);

export interface TotalRow {
  /** Clave tal como la nombro el servidor: `subtotal`, `discount`. */
  key: string;
  amount: string;
  /** Si al dibujarlo hay que anteponerle el signo menos. */
  subtracted: boolean;
}

/**
 * Las lineas del desglose, sin el total.
 *
 * El total se dibuja aparte porque es lo que se paga, no un concepto mas de la
 * suma; ponerlo en la misma lista lo dejaria como una fila cualquiera.
 */
export function breakdownRows(totals: CartTotals): TotalRow[] {
  const keys = Object.keys(totals).filter((key) => key !== 'total');

  keys.sort((a, b) => {
    const left = BREAKDOWN_ORDER.indexOf(a);
    const right = BREAKDOWN_ORDER.indexOf(b);
    // Lo desconocido va al final, y entre si conserva el orden del servidor.
    return (left === -1 ? BREAKDOWN_ORDER.length : left) - (right === -1 ? BREAKDOWN_ORDER.length : right);
  });

  return keys.map((key) => ({
    key,
    amount: totals[key],
    // Un concepto nuevo se dibuja sin signo, que es lo correcto por defecto:
    // casi todo suma, y el total manda de todas formas.
    subtracted: SUBTRACTED.has(key) && hasAmount(totals[key]),
  }));
}

/**
 * Si un importe dice algo distinto de cero.
 *
 * Es una decision de presentacion, no una cuenta: el valor no se opera ni se
 * deriva de el ningun total, solo se decide si la anotacion vale la pena. El
 * importe que se dibuja sigue siendo la cadena original del servidor.
 *
 * Se usa **solo para anotaciones por linea**, nunca para el desglose de
 * importes: alli se dibuja todo lo que llega, aunque venga en cero, porque es el
 * resumen de lo que se paga y esconder una fila lo dejaria incompleto. Bajo cada
 * linea, en cambio, un "Rebaja 0.00" en cada compra es solo ruido.
 */
export function hasAmount(amount: string): boolean {
  return amount !== '' && Number.parseFloat(amount) !== 0;
}

/** Cuantas unidades hay en la bolsa. Es el numero que muestra la barra. */
export function itemCount(cart: Cart | null): number {
  return (cart?.items ?? []).reduce((count, line) => count + line.quantity, 0);
}

/**
 * En que se quedo una peticion del carrito que fallo.
 *
 * Son los desenlaces que el contrato documenta, y cada uno se responde distinto:
 * `gone` se arregla solo (se abre otra bolsa), `throttled` esperando, `rejected`
 * corrigiendo lo que se pidio, `offline` volviendo mas tarde. Un unico mensaje
 * de error los taparia todos y dejaria a quien compra sin saber que hacer.
 */
export type CartFailure = 'offline' | 'gone' | 'rejected' | 'throttled' | 'unknown';

export function classifyFailure(cause: unknown): CartFailure {
  if (!(cause instanceof ApiError)) return 'unknown';

  // 0 no es un codigo del servidor: es que no contesto.
  if (cause.isNetworkFailure) return 'offline';

  switch (cause.status) {
    // El token no corresponde a ningun carrito: consumido por un checkout,
    // descartado, o de otra instalacion. No existe y no va a volver.
    case 404:
      return 'gone';
    case 400:
      return 'rejected';
    // Hay throttling puesto (120/min anonimo). No es un fallo de la tienda ni
    // de lo que se pidio: es que se pidio muy seguido.
    case 429:
      return 'throttled';
    default:
      return 'unknown';
  }
}

/** El motivo que redacto el servidor, cuando lo mando. */
export function failureDetail(cause: unknown): string | null {
  return cause instanceof ApiError ? cause.detail : null;
}
