import { useState } from 'react';
import { Shirt, Flame, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Product } from '../types';

export function ProductCard({ product, onSelect }: { product: Product; onSelect: (product: Product) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

  return (
    <div
      className="group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(product)}
    >
      <div className="aspect-square bg-[#fafafa] mb-4 md:mb-6 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full relative">
            <div
              className="absolute inset-0 transition-opacity duration-500"
              style={{
                opacity: isHovered ? 0.6 : 0,
                background: 'radial-gradient(circle at center, rgba(255,90,31,0.15) 0%, transparent 70%)',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {product.category === 'hoodie'   && <Shirt  size={64} className="opacity-[0.15]" strokeWidth={1} />}
              {product.category === 'lighter'  && <Flame  size={64} className="opacity-[0.15]" strokeWidth={1} />}
              {product.category === 'griptape' && <Layers size={64} className="opacity-[0.15]" strokeWidth={1} />}
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
          <span className="px-4 py-2 md:px-7 md:py-3 bg-white text-black text-[10px] md:text-xs tracking-widest uppercase border border-black">
            {t('product.view')}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-xs md:text-sm tracking-wide leading-snug">{product.name}</h3>
        <p className="text-black/35 tracking-wider text-xs md:text-sm">${product.price}</p>
      </div>
    </div>
  );
}
