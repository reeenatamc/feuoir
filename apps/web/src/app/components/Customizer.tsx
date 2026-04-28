import { Shirt, Flame, Layers, X, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Product } from '../types';

const categoryIcons: Record<string, typeof Flame> = {
  hoodie:   Shirt,
  lighter:  Flame,
  griptape: Layers,
  custom:   Flame,
};

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

  const Icon = categoryIcons[product.category] ?? Flame;

  const handleAdd = () => {
    onAddToCart(product);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full md:max-w-lg md:mx-8 max-h-[92vh] md:max-h-[88vh] overflow-y-auto rounded-t-2xl md:rounded-none">

        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-black/10 rounded-full" />
        </div>

        <div className="sticky top-0 bg-white border-b border-black/8 px-6 py-4 md:px-10 md:py-6 flex items-center justify-between z-10">
          <p className="text-[10px] tracking-[0.35em] uppercase text-black/35">
            {t(`product.category.${product.category}`, product.category)}
          </p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-black/40 hover:text-black active:text-black/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 md:p-10 space-y-7">
          <div className="w-full aspect-[4/3] bg-[#fafafa] relative overflow-hidden flex items-center justify-center">
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,90,31,0.06) 0%, transparent 70%)' }}
            />
            <Icon size={80} className="opacity-[0.1]" strokeWidth={0.8} />
          </div>

          <div className="space-y-2.5">
            <h2 className="text-xl md:text-2xl tracking-tight leading-tight">{product.name}</h2>
            {product.description && (
              <p className="text-sm md:text-base text-black/55 tracking-wide leading-relaxed">
                {product.description}
              </p>
            )}
            <p className="text-lg tracking-widest">${product.price}</p>
          </div>

          <button
            onClick={handleAdd}
            className="w-full py-4 bg-black text-white text-sm tracking-widest uppercase hover:bg-black/80 active:bg-black/70 transition-colors relative overflow-hidden group"
          >
            <span className="relative z-10">{t('product.addToCart', { price: product.price })}</span>
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'linear-gradient(90deg, rgba(255,90,31,0.12), rgba(193,18,31,0.12))' }}
            />
          </button>

          <div className="border-t border-black/6 pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-[2px]" style={{ background: 'linear-gradient(90deg, #FF5A1F, #C1121F)' }} />
                <p className="text-[10px] tracking-[0.3em] uppercase text-black/35">{t('product.comingSoon')}</p>
              </div>
              <ArrowRight size={12} className="text-black/20" />
            </div>
            <p className="text-xs tracking-wide text-black/40 leading-relaxed">{t('product.comingSoonDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
