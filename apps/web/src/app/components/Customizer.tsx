import { X, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { categoryIcon, categoryLabelKey } from '../lib/catalog';
import type { Product } from '../types';
import { fire, fireGradient } from '../theme/color';

/**
 * Vista previa de un producto del catalogo legado de Supabase.
 *
 * No lleva boton de comprar. La bolsa del servidor se llena con **variantes**, y
 * un producto de Supabase no tiene ninguna: es otro almacen, con otro espacio de
 * identificadores. Un boton aqui solo podria mandar un numero que la API no
 * reconoce. Lo que se compra son las piezas de la serie, y esas se agregan desde
 * su ficha. Este modal desaparece con el resto del camino legado.
 */
export function Customizer({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  if (!product) return null;

  const Icon = categoryIcon(product.category);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-ink/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface w-full md:max-w-lg md:mx-8 max-h-[92vh] md:max-h-[88vh] overflow-y-auto rounded-t-2xl md:rounded-none">

        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-ink/10 rounded-full" />
        </div>

        <div className="sticky top-0 bg-surface border-b border-ink/8 px-6 py-4 md:px-10 md:py-6 flex items-center justify-between z-10">
          <p className="text-[10px] tracking-[0.35em] uppercase text-ink/35">
            {t(categoryLabelKey(product.category), product.category)}
          </p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-ink/40 hover:text-ink active:text-ink/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 md:p-10 space-y-7">
          <div className="w-full aspect-[4/3] bg-surface-sunken relative overflow-hidden flex items-center justify-center">
            <div
              className="absolute inset-0"
              style={{ background: `radial-gradient(circle at 50% 50%, ${fire('orange', 6)} 0%, transparent 70%)` }}
            />
            <Icon size={80} className="opacity-[0.1]" strokeWidth={0.8} />
          </div>

          <div className="space-y-2.5">
            <h2 className="text-xl md:text-2xl tracking-tight leading-tight">{product.name}</h2>
            {product.description && (
              <p className="text-sm md:text-base text-ink/55 tracking-wide leading-relaxed">
                {product.description}
              </p>
            )}
            <p className="text-lg tracking-widest">${product.price}</p>
          </div>

          <div className="border-t border-ink/6 pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-[2px]" style={{ background: fireGradient([['orange'], ['red']]) }} />
                <p className="text-[10px] tracking-[0.3em] uppercase text-ink/35">{t('product.comingSoon')}</p>
              </div>
              <ArrowRight size={12} className="text-ink/20" />
            </div>
            <p className="text-xs tracking-wide text-ink/40 leading-relaxed">{t('product.comingSoonDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
