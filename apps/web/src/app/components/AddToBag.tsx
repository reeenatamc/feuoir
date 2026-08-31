import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TransitionLink } from '../lib/navigation';
import { useBag } from '../lib/CartProvider';
import type { CartFailure } from '../content/cart';
import type { SaleVariant } from '../content/objects';
import { ROUTES } from '../content/vocabulary';
import { BagNotice } from './BagNotice';

/** Mismo tratamiento que el resto de las acciones de la ficha. */
const ACTION = 'inline-flex items-center gap-3 text-[11px] tracking-[0.25em] uppercase border-b border-ink/40 pb-1.5 transition-opacity hover:opacity-60 disabled:opacity-35';

/**
 * El boton que pone la pieza en la bolsa.
 *
 * Es un boton y no un enlace: lo que hace es una escritura contra el servidor,
 * no ir a otra pagina. Antes era un enlace a `/bag` que no agregaba nada, y la
 * bolsa quedaba vacia despues de pulsarlo.
 *
 * El fallo se guarda aqui y no en el contexto compartido: si viviera alli, un
 * rechazo en esta ficha seguiria pintado al abrir la bolsa un minuto despues.
 */
export function AddToBag({ variant }: { variant: SaleVariant }) {
  const { t } = useTranslation();
  const { addItem, busy } = useBag();
  const [added, setAdded] = useState(false);
  const [failure, setFailure] = useState<{ failure: CartFailure; detail: string | null } | null>(null);

  const add = async () => {
    setAdded(false);
    setFailure(null);

    const outcome = await addItem(variant.id);

    if (outcome.ok) {
      setAdded(true);
      return;
    }

    setFailure({ failure: outcome.failure, detail: outcome.detail });
  };

  return (
    <div>
      <button type="button" onClick={add} disabled={busy} className={ACTION}>
        {busy ? t('bag.adding') : t('bag.add')}
        <span aria-hidden="true">↗</span>
      </button>

      {/* La confirmacion no reemplaza al boton: una pieza puede llevarse mas de
          una unidad, y esconder el control despues del primer clic obligaria a
          ir a la bolsa para pedir la segunda. */}
      {added && !failure && (
        <p role="status" className="mt-4 text-sm text-ink/55">
          {t('bag.added')}{' '}
          <TransitionLink to={ROUTES.bag} className="underline underline-offset-4 hover:opacity-60">
            {t('bag.view')}
          </TransitionLink>
        </p>
      )}

      {failure && <BagNotice failure={failure.failure} detail={failure.detail} />}
    </div>
  );
}
