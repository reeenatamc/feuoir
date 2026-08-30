import { X, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { categoryIcon, categoryLabelKey } from '../lib/catalog';
import type { Product } from '../types';
import { fire, fireGradient } from '../theme/color';

export function Customizer({
  product,
  onClose,
  onAddToCart,
}: {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}) {
  const { t } = useTranslation();

  if (!product) return null;

  const Icon = categoryIcon(product.category);

  const handleAdd = () => {
    onAddToCart(product);
    onClose();
  };

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

          <button
            onClick={handleAdd}
            className="w-full py-4 bg-ink text-ink-inverse text-sm tracking-widest uppercase hover:bg-ink/80 active:bg-ink/70 transition-colors relative overflow-hidden group"
          >
            <span className="relative z-10">{t('product.addToCart', { price: product.price })}</span>
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: fireGradient([['orange', 12], ['red', 12]]) }}
            />
          </button>

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
