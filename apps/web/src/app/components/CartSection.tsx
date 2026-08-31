import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TransitionLink } from '../lib/navigation';
import { useBag } from '../lib/CartProvider';
import type { BagOutcome } from '../lib/CartProvider';
import type { CartFailure, CartLine, Order } from '../content/cart';
import type { CheckoutForm as FormValues } from '../content/checkout';
import { ROUTES } from '../content/vocabulary';
import type { Settings } from '../types';
import { BagNotice } from './BagNotice';
import { BagTotals, DiscountList, LineRow } from './BagSummary';
import { CheckoutForm } from './CheckoutForm';
import { FIELD } from './FormField';
import { OrderCreated } from './OrderCreated';

/**
 * La bolsa, contra el carrito del servidor.
 *
 * Antes leia un arreglo en memoria de `App` y armaba un mensaje de WhatsApp con
 * una suma hecha en el cliente. Ahora las lineas, las cantidades y **los
 * importes** salen de la API: el carrito los calcula con la misma funcion que la
 * orden usa para congelarlos, asi que sumar aqui solo podria producir un total
 * distinto del que se cobra.
 *
 * Los tres momentos de la compra viven en esta pantalla y no en tres rutas.
 * La razon es la de en medio: la orden recien creada solo se puede releer con un
 * endpoint que exige token, con lo que una URL propia llevaria a una pagina
 * incapaz de cargar lo que promete.
 */
type Phase = { name: 'bag' } | { name: 'checkout' } | { name: 'order'; order: Order };

/** Contenedor comun: la bolsa ocupa el mismo hueco en sus tres momentos. */
function BagPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="section--museum min-h-screen px-6 md:px-10 pt-32 md:pt-44 pb-24 md:pb-40">
      <div className="max-w-[1600px] mx-auto">
        <h1 className="text-4xl md:text-6xl tracking-[-0.03em] mb-10 md:mb-16">{title}</h1>
        {children}
      </div>
    </section>
  );
}

/**
 * Cantidad y borrado de una linea.
 *
 * El minimo es uno y no cero: el contrato lo fija asi porque vaciar una linea ya
 * tiene su operacion, y dos formas de hacer lo mismo terminan comportandose
 * distinto. Por eso a una unidad el boton de restar se apaga y lo que queda es
 * quitar.
 */
function LineControls({
  line,
  busy,
  onQuantity,
  onRemove,
}: {
  line: CartLine;
  busy: boolean;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();

  const step = 'w-8 h-8 border border-ink/20 text-sm leading-none transition-colors hover:border-ink disabled:opacity-30 disabled:hover:border-ink/20';

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={step}
          disabled={busy || line.quantity <= 1}
          onClick={() => onQuantity(line.quantity - 1)}
          aria-label={t('bag.decrease')}
        >
          <span aria-hidden="true">−</span>
        </button>

        <span className="text-sm tabular-nums w-6 text-center" aria-live="polite">
          {line.quantity}
        </span>

        <button
          type="button"
          className={step}
          disabled={busy}
          onClick={() => onQuantity(line.quantity + 1)}
          aria-label={t('bag.increase')}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={busy}
        className="text-[10px] tracking-[0.26em] uppercase text-ink/45 hover:text-ink transition-colors disabled:opacity-35"
      >
        {t('bag.remove')}
      </button>
    </div>
  );
}

/**
 * El cupon.
 *
 * Vive en la bolsa y no en el checkout porque es donde quien compra lo escribe y
 * ve bajar el total, que es justamente lo que garantiza que el cobro no difiera
 * de lo que mostro la pantalla anterior. El codigo lo normaliza el servidor
 * (`verano10` y ` VERANO10 ` son el mismo cupon), asi que se manda tal cual.
 */
function DiscountCode({
  code,
  busy,
  onApply,
  onRemove,
}: {
  code: string;
  busy: boolean;
  onApply: (code: string) => Promise<BagOutcome>;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  const [value, setValue] = useState('');
  const [rejected, setRejected] = useState<string | null>(null);

  // Con un cupon puesto no se ofrece el campo otra vez: lo que cabe es quitarlo.
  if (code) {
    return (
      <div className="mt-8 flex items-baseline justify-between gap-4">
        <p className="text-[10px] tracking-[0.26em] uppercase text-ink/45">
          {t('bag.discountApplied')} <span className="text-ink/70">{code}</span>
        </p>
        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          className="text-[10px] tracking-[0.26em] uppercase text-ink/45 hover:text-ink transition-colors disabled:opacity-35 shrink-0"
        >
          {t('bag.discountRemove')}
        </button>
      </div>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!value.trim()) return;

    setRejected(null);
    const outcome = await onApply(value.trim());

    // El rechazo se explica con el motivo del servidor: es el unico que sabe si
    // el codigo no existe, vencio, o no llega al minimo de esta compra.
    if (!outcome.ok) setRejected(outcome.detail ?? t('bag.discountRejected'));
    else setValue('');
  };

  return (
    <form onSubmit={submit} className="mt-8">
      <label className="block text-[10px] tracking-[0.26em] uppercase text-ink/45 mb-1" htmlFor={id}>
        {t('bag.discountLabel')}
      </label>
      <div className="flex items-baseline gap-4">
        <input
          id={id}
          className={`${FIELD} uppercase`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="text-[10px] tracking-[0.26em] uppercase text-ink/45 hover:text-ink transition-colors disabled:opacity-35 shrink-0"
        >
          {t('bag.discountApply')}
        </button>
      </div>
      {rejected && (
        <p role="alert" className="mt-2 text-[11px] leading-relaxed text-ink/60">
          {rejected}
        </p>
      )}
    </form>
  );
}

export function CartSection({ settings }: { settings: Settings }) {
  const { t } = useTranslation();
  const { status, cart, loadFailure, busy, setQuantity, removeItem, applyDiscount, removeDiscount, checkout } =
    useBag();
  const [phase, setPhase] = useState<Phase>({ name: 'bag' });
  const [failure, setFailure] = useState<{ failure: CartFailure; detail: string | null } | null>(null);

  const edit = async (operation: () => ReturnType<typeof removeItem>) => {
    setFailure(null);
    const outcome = await operation();
    if (!outcome.ok) setFailure({ failure: outcome.failure, detail: outcome.detail });
  };

  // La orden manda sobre todo lo demas: al crearla el servidor consume el
  // carrito, con lo que `cart` pasa a `null` y sin esta rama la pantalla saltaria
  // al aviso de bolsa vacia justo despues de comprar.
  if (phase.name === 'order') {
    return (
      <BagPage title={t('order.title')}>
        <OrderCreated order={phase.order} settings={settings} />
      </BagPage>
    );
  }

  if (status === 'loading') {
    return (
      <BagPage title={t('bag.title')}>
        <p role="status" className="text-sm leading-relaxed text-ink/55">
          {t('bag.loading')}
        </p>
      </BagPage>
    );
  }

  // Con la API caida la bolsa dice que paso en vez de quedarse en blanco: una
  // pagina vacia se lee como "no tienes nada", que es una afirmacion distinta.
  if (status === 'error' && loadFailure) {
    return (
      <BagPage title={t('bag.title')}>
        <BagNotice failure={loadFailure} detail={null} />
      </BagPage>
    );
  }

  const lines = cart?.items ?? [];

  if (lines.length === 0) {
    return (
      <BagPage title={t('bag.title')}>
        <div className="space-y-6">
          <p className="text-sm leading-relaxed text-ink/55">{t('bag.empty')}</p>
          <TransitionLink
            to={ROUTES.objects}
            className="inline-flex items-center gap-3 text-[11px] tracking-[0.25em] uppercase border-b border-ink/40 pb-1.5 transition-opacity hover:opacity-60"
          >
            {t('bag.browse')}
            <span aria-hidden="true">↗</span>
          </TransitionLink>
        </div>

        {failure && <BagNotice failure={failure.failure} detail={failure.detail} />}
      </BagPage>
    );
  }

  // A partir de aqui hay bolsa con lineas, asi que `cart` no es nulo.
  const bag = cart!;

  if (phase.name === 'checkout') {
    return (
      <BagPage title={t('checkout.pageTitle')}>
        <CheckoutForm
          requiresTaxId={bag.requiresTaxId}
          busy={busy}
          onSubmit={(form: FormValues) => checkout(form)}
          onCreated={(order) => setPhase({ name: 'order', order })}
          onBack={() => setPhase({ name: 'bag' })}
        />
      </BagPage>
    );
  }

  return (
    <BagPage title={t('bag.title')}>
      <div className="grid grid-cols-12 gap-x-6 gap-y-12">
        <ul className="col-span-12 md:col-span-7 border-b border-ink/10">
          {lines.map((line) => (
            <LineRow
              key={line.id}
              line={line}
              currency={bag.currency}
              controls={
                <LineControls
                  line={line}
                  busy={busy}
                  onQuantity={(quantity) => edit(() => setQuantity(line.id, quantity))}
                  onRemove={() => edit(() => removeItem(line.id))}
                />
              }
            />
          ))}
        </ul>

        <div className="col-span-12 md:col-span-4 md:col-start-9 md:sticky md:top-32 md:self-start">
          <BagTotals totals={bag.totals} currency={bag.currency} />

          {/* Que promocion bajo el total. Importa sobre todo con envio gratis:
              `shipping` sigue diciendo su importe bruto, y sin esta lista la
              pantalla mostraria un cargo de envio que nadie paga. */}
          <DiscountList discounts={bag.discounts} currency={bag.currency} />

          <DiscountCode
            code={bag.discountCode}
            busy={busy}
            onApply={applyDiscount}
            onRemove={() => edit(removeDiscount)}
          />

          {/* El aviso del documento llega de la bolsa y no del checkout: el
              umbral legal es del backend, y saberlo aqui es lo que evita que el
              requisito aparezca como una sorpresa al confirmar. */}
          {bag.requiresTaxId && (
            <p className="mt-6 text-sm leading-relaxed text-ink/55">{t('bag.taxIdNotice')}</p>
          )}

          <button
            type="button"
            onClick={() => setPhase({ name: 'checkout' })}
            disabled={busy}
            className="mt-8 inline-flex items-center gap-3 text-[11px] tracking-[0.25em] uppercase border-b border-ink/40 pb-1.5 transition-opacity hover:opacity-60 disabled:opacity-35"
          >
            {t('bag.checkout')}
            <span aria-hidden="true">↗</span>
          </button>

          {failure && <BagNotice failure={failure.failure} detail={failure.detail} />}
        </div>
      </div>
    </BagPage>
  );
}
