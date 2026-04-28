import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { ProductCard } from './ProductCard';
import type { Product } from '../types';

export function ProductGrid({ onSelect }: { onSelect: (product: Product) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('id')
      .then(({ data }) => {
        setProducts((data as Product[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <section className="min-h-screen py-16 md:py-32 px-6 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 md:mb-24 text-center">
          <h2 className="text-3xl md:text-5xl lg:text-6xl tracking-tight mb-3 md:mb-6">{t('shop.title')}</h2>
          <p className="text-sm md:text-xl tracking-wide text-black/50">{t('shop.subtitle')}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 md:gap-x-8 gap-y-10 md:gap-y-20">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-square bg-[#fafafa] animate-pulse" />
                <div className="h-3 bg-[#fafafa] animate-pulse w-3/4" />
                <div className="h-3 bg-[#fafafa] animate-pulse w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 md:gap-x-8 gap-y-10 md:gap-y-20">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
