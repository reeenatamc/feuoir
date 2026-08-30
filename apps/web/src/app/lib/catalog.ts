import { Flame, Layers, Shirt } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Product } from '../types';

/**
 * Fuente unica de verdad para la presentacion de categorias.
 * Antes estaba duplicada en AdminPanel, Customizer y ProductCard, con
 * distinto contenido en cada copia.
 *
 * Los NOMBRES visibles de cada categoria no viven aca: salen de i18n
 * (`product.category.<categoria>`), para que se traduzcan.
 */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  griptape: Layers,
  lighter:  Flame,
  hoodie:   Shirt,
  custom:   Flame,
};

export function categoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? Flame;
}

/** Clave i18n del nombre visible de una categoria. */
export function categoryLabelKey(category: string): string {
  return `product.category.${category}`;
}

export const PRODUCT_STATUS_STYLE: Record<Product['status'], string> = {
  active:   'bg-emerald-50 text-emerald-700',
  draft:    'bg-black/5 text-black/50',
  archived: 'bg-red-50 text-red-600',
};

/** Rotacion de estado al hacer click en el badge del admin. */
export const NEXT_PRODUCT_STATUS: Record<Product['status'], Product['status']> = {
  active:   'draft',
  draft:    'active',
  archived: 'active',
};
