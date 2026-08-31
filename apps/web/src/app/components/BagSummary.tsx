import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { breakdownRows, hasAmount } from '../content/cart';
import type { CartDiscount, CartLine, CartTotals } from '../content/cart';

/**
 * Como se dibujan las lineas y los importes, en la bolsa y en la orden.
 *
 * Es el mismo componente para las dos a proposito: el contrato de la API declara
 * que `items[]` tiene la misma forma en el carrito y en la orden justamente para
 * que se pinten igual. Lo unico que cambia es que en la bolsa la linea lleva
 * controles y en la orden no, y eso entra por `controls`.
 */

/** Las opciones de la variante, en una linea: `Talle: M · Color: Oxido`. */
function describeOptions(options: Record<string, string>): string {
  return Object.entries(options)
    .map(([name, value]) => `${name}: ${value}`)
    .join(' · ');
}

export function LineRow({
  line,
  currency,
  controls,
}: {
  line: CartLine;
  currency: string;
  /** Cantidad y borrado en la bolsa; nada en la orden, que ya no se edita. */
  controls?: ReactNode;
}) {
  const { t } = useTranslation();
  const options = describeOptions(line.options);

  return (
    <li className="border-t border-ink/10 py-6 grid grid-cols-12 gap-x-4 gap-y-3 items-baseline">
      <div className="col-span-12 sm:col-span-6">
        <h3 className="text-base md:text-lg tracking-wide">{line.productName}</h3>
        {/* El nombre de la variante solo si dice algo: en una pieza unica es
            "Pieza unica", que ya se sabe. Las opciones, cuando las hay. */}
        {options && <p className="mt-1 text-[11px] tracking-[0.2em] uppercase text-ink/40">{options}</p>}
        <p className="mt-1 text-[10px] tracking-[0.26em] uppercase text-ink/30">{line.sku}</p>
      </div>

      {/* Los importes se imprimen tal como llegaron, sin pasar por `Number`:
          viajan como texto decimal exacto y convertirlos solo puede empeorarlos. */}
      <p className="col-span-6 sm:col-span-3 text-[11px] tracking-[0.2em] uppercase text-ink/45 tabular-nums">
        {t('bag.unitPrice')} {line.unitPrice} {currency}
      </p>

      <div className="col-span-6 sm:col-span-3 text-right">
        <p className="text-sm tabular-nums">
          {line.lineTotal} {currency}
        </p>
        {/* `line_total` es el importe BRUTO: lo que se cobra por la linea es la
            resta de los dos. Se muestran los dos numeros del servidor en vez de
            restarlos aqui -- restar decimales en JavaScript es como aparece una
            diferencia de un centavo entre la pantalla y el cobro. */}
        {hasAmount(line.discountAmount) && (
          <p className="mt-1 text-[11px] tracking-[0.2em] uppercase tabular-nums text-ink/45">
            {t('bag.lineDiscount')} −{line.discountAmount} {currency}
          </p>
        )}
      </div>

      {controls && <div className="col-span-12">{controls}</div>}
    </li>
  );
}

/**
 * Las promociones aplicadas, con su nombre.
 *
 * `totals.discount` dice cuanto bajo el total pero no por que, y hay un caso en
 * que eso se nota: con envio gratis, `shipping` sigue diciendo su importe bruto
 * -- el envio se cobra y la promocion lo compensa, para no perder cuanto costaba
 * enviarlo. Sin esta lista, la pantalla mostraria un cargo de envio que en
 * realidad nadie paga.
 */
export function DiscountList({
  discounts,
  currency,
}: {
  discounts: CartDiscount[];
  currency: string;
}) {
  // Sin `t`: el nombre de la promocion lo redacta el servidor. Es un dato, como
  // el nombre de una pieza, y no texto de la interfaz que se pueda traducir.
  if (discounts.length === 0) return null;

  return (
    <ul className="mt-4 space-y-2">
      {discounts.map((discount) => (
        <li
          key={`${discount.name}-${discount.scope}`}
          className="flex items-baseline justify-between gap-4 text-[11px] tracking-[0.16em] uppercase text-ink/50"
        >
          <span>
            {discount.name}
            {/* Un codigo vacio significa promocion automatica: no hace falta
                preguntar de que clase es, la ausencia ya lo dice. */}
            {discount.codeUsed && <span className="text-ink/35"> · {discount.codeUsed}</span>}
          </span>
          <span className="tabular-nums shrink-0">
            −{discount.amountApplied} {currency}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * El desglose de importes, tal como lo calculo el servidor.
 *
 * Se recorre `totals` entero en vez de leer cuatro campos por su nombre. El
 * motivo es concreto: el backend calcula estos importes con la misma funcion que
 * usa la orden para congelar los suyos, y si alli se agrega un concepto -- un
 * descuento -- una lista cerrada de campos lo dejaria fuera del desglose
 * mientras el total seguiria incluyendolo. Aqui no se suma nada.
 */
export function BagTotals({ totals, currency }: { totals: CartTotals; currency: string }) {
  const { t } = useTranslation();
  const rows = breakdownRows(totals);

  return (
    <dl className="text-sm">
      {rows.map(({ key, amount, subtracted }) => (
        <div key={key} className="flex items-baseline justify-between gap-6 py-2">
          {/* Una clave que el frontend no sabe nombrar se muestra con el nombre
              que le puso el servidor. Es peor leer `handling` que "Manipulacion",
              pero mucho peor es esconder un importe que esta dentro del total. */}
          <dt className="text-[10px] tracking-[0.26em] uppercase text-ink/45">
            {t(`bag.totals.${key}`, { defaultValue: key })}
          </dt>
          {/* El signo del descuento es presentacion: los digitos son los del
              servidor. Sin el, en una columna donde todo suma, la cuenta se lee
              como si estuviera mal. */}
          <dd className="tabular-nums text-ink/70">
            {subtracted && '−'}
            {amount} {currency}
          </dd>
        </div>
      ))}

      {totals.total && (
        <div className="flex items-baseline justify-between gap-6 border-t border-ink mt-2 pt-4">
          <dt className="text-[10px] tracking-[0.26em] uppercase">{t('bag.totals.total')}</dt>
          <dd className="text-lg tabular-nums">
            {totals.total} {currency}
          </dd>
        </div>
      )}
    </dl>
  );
}
