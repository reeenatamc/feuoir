import { TransitionLink } from '../lib/navigation';
import { useTranslation } from 'react-i18next';
import type { CartItem, Settings } from '../types';
import { fireGradient } from '../theme/color';
import { whatsappLink as buildWhatsappLink } from '../lib/whatsapp';

export function CartSection({ cart, settings }: { cart: CartItem[]; settings: Settings }) {
  const { t } = useTranslation();
  const total = cart.reduce((s, i) => s + i.product.price, 0);

  // El armado del enlace vive en `lib/whatsapp`: la normalizacion del numero es
  // la misma aqui y en los encargos, y duplicada es como se termina arreglando
  // en un sitio y no en el otro.
  const whatsappLink = (() => {
    const lines = cart.map((i) => `• ${i.product.name} — $${i.product.price}`).join('\n');
    return buildWhatsappLink(
      settings.whatsapp,
      `Hola! Quiero ordenar:\n${lines}\nTotal: ${settings.currency} ${total}`
    );
  })();

  return (
    <section className="min-h-screen py-16 md:py-32 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-6xl tracking-tight mb-8 md:mb-16">{t('cart.title')}</h2>

        {cart.length === 0 ? (
          <div className="space-y-6">
            <p className="text-base md:text-xl tracking-wide text-ink/40">{t('cart.empty')}</p>
            <TransitionLink
              to="/shop"
              className="inline-block text-sm tracking-widest uppercase underline underline-offset-4 hover:opacity-60 transition-opacity"
            >
              {t('cart.shopLink')}
            </TransitionLink>
          </div>
        ) : (
          <div>
            {cart.map((item, index) => (
              <div key={index} className="border-t border-ink/8 py-5 flex justify-between items-center gap-4">
                <div className="space-y-0.5">
                  <h3 className="text-base md:text-lg tracking-wide">{item.product.name}</h3>
                  <p className="text-[10px] tracking-widest uppercase text-ink/30">{item.product.category}</p>
                </div>
                <p className="text-base tracking-widest shrink-0">{settings.currency} {item.product.price}</p>
              </div>
            ))}

            <div className="border-t border-ink py-5 flex justify-between items-center">
              <span className="text-xs tracking-widest uppercase text-ink/40">{t('cart.total')}</span>
              <span className="text-xl tracking-widest">{settings.currency} {total}</span>
            </div>

            {whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block w-full py-4 bg-ink text-ink-inverse text-[11px] tracking-[0.3em] uppercase text-center hover:bg-ink/80 active:bg-ink/70 transition-colors relative overflow-hidden group"
              >
                <span className="relative z-10">{t('cart.checkout')}</span>
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: fireGradient([['orange', 12], ['red', 12]]) }}
                />
              </a>
            ) : (
              <div className="mt-4 w-full py-4 border border-ink/10 text-center space-y-1">
                <p className="text-[11px] tracking-widest uppercase text-ink/30">{t('cart.noCheckout')}</p>
                <p className="text-[10px] text-ink/25 tracking-wide">
                  {t('cart.noCheckoutHint')}{' '}
                  <TransitionLink to="/admin" className="underline hover:opacity-60">{t('cart.adminConfig')}</TransitionLink>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
