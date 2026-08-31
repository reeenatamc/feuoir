import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { classifyFailure, failureDetail } from '../content/cart';
import type { CartFailure, Order } from '../content/cart';
import { requestPaymentLink } from '../lib/cartApi';
import { TransitionLink } from '../lib/navigation';
import { whatsappLink } from '../lib/whatsapp';
import { ROUTES } from '../content/vocabulary';
import type { Settings } from '../types';
import { BagNotice } from './BagNotice';
import { BagTotals, DiscountList, LineRow } from './BagSummary';

/**
 * Lo que queda despues de comprar: el numero de orden y el paso de pago.
 *
 * **Crear la orden no la cobra.** El contrato separa los dos hechos a proposito:
 * `status` es la logistica y `payment_status` el dinero, y una orden confirmada
 * con el pago pendiente es el caso normal de esta tienda, no una anomalia. Por
 * eso esta pantalla no dice "pagado": dice cual es el numero y por donde se
 * paga.
 *
 * No es una ruta propia. La orden solo se puede releer con `GET
 * /api/orders/{numero}/`, que exige token, asi que una URL compartible llevaria
 * a una pagina que no puede cargar lo que promete. Se muestra una vez, y el
 * numero queda a la vista para copiarlo.
 */
export function OrderCreated({ order, settings }: { order: Order; settings: Settings }) {
  const { t } = useTranslation();
  const [link, setLink] = useState<string | null>(null);
  const [failure, setFailure] = useState<CartFailure | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  /**
   * Pide el intento de pago.
   *
   * Es un viaje aparte y no parte del checkout porque una orden admite varios
   * intentos: un rechazo y un reintento son dos hechos distintos y los dos
   * quedan registrados. `attempt` es lo que permite reintentar sin remontar.
   */
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    setFailure(null);
    setDetail(null);

    requestPaymentLink(order.orderNumber, controller.signal)
      .then((url) => {
        if (!active) return;
        setLink(url);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        console.error('[api] intento de pago:', cause);
        setFailure(classifyFailure(cause));
        setDetail(failureDetail(cause));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [order.orderNumber, attempt]);

  /**
   * Si el proveedor no contesto, el enlace se arma con el numero de la tienda.
   *
   * La orden ya existe y su numero es la credencial para cobrarla: dejar a quien
   * acaba de comprar sin ninguna via de pago porque fallo un viaje seria perder
   * la venta que ya esta hecha. `null` si no hay numero configurado, y entonces
   * solo queda reintentar.
   */
  const fallback = whatsappLink(
    settings.whatsapp,
    t('order.message', { number: order.orderNumber, total: order.totals.total ?? '', currency: order.currency })
  );

  const payUrl = link ?? fallback;

  return (
    <div className="grid grid-cols-12 gap-x-6 gap-y-12">
      <div className="col-span-12 md:col-span-7">
        <p className="text-[10px] tracking-[0.26em] uppercase text-ink/40 mb-3">
          {t('order.number')}
        </p>
        <p className="text-2xl md:text-4xl tracking-[-0.02em] tabular-nums mb-6">
          {order.orderNumber}
        </p>
        <p className="max-w-[42ch] text-sm leading-relaxed text-ink/55">{t('order.lead')}</p>

        <ul className="mt-12 border-b border-ink/10">
          {order.items.map((line) => (
            <LineRow key={line.id} line={line} currency={order.currency} />
          ))}
        </ul>
      </div>

      <div className="col-span-12 md:col-span-4 md:col-start-9">
        <BagTotals totals={order.totals} currency={order.currency} />

        {/* En la orden `discounts` es una copia congelada, no una referencia a
            las reglas: cambiar la promocion despues no altera esta compra. */}
        <DiscountList discounts={order.discounts} currency={order.currency} />

        <div className="mt-10 border-t border-ink/10 pt-8">
          <h2 className="text-[10px] tracking-[0.26em] uppercase text-ink/40 mb-3">
            {t('order.paymentTitle')}
          </h2>
          <p className="text-sm leading-relaxed text-ink/55 mb-6">{t('order.paymentLead')}</p>

          {payUrl ? (
            <a
              href={payUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 text-[11px] tracking-[0.25em] uppercase border-b border-ink/40 pb-1.5 transition-opacity hover:opacity-60"
            >
              {t('order.pay')}
              <span aria-hidden="true">↗</span>
            </a>
          ) : failure ? (
            <>
              <BagNotice failure={failure} detail={detail} />
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="mt-6 text-[10px] tracking-[0.26em] uppercase text-ink/45 hover:text-ink transition-colors"
              >
                {t('order.retry')}
              </button>
            </>
          ) : (
            <p role="status" className="text-sm text-ink/55">
              {t('order.preparing')}
            </p>
          )}
        </div>

        <TransitionLink
          to={ROUTES.objects}
          className="inline-block mt-10 text-[10px] tracking-[0.26em] uppercase text-ink/45 hover:text-ink transition-colors"
        >
          {t('order.keepShopping')}
        </TransitionLink>
      </div>
    </div>
  );
}
