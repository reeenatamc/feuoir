import { createClient } from '@supabase/supabase-js';
import type { Settings } from '../types';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key);

// Settings DB ↔ TypeScript mappers
export function settingsFromDb(row: Record<string, unknown>): Settings {
  return {
    whatsapp:     (row.whatsapp      as string) ?? '',
    shippingCost: (row.shipping_cost as number) ?? 10,
    currency:     (row.currency      as string) ?? 'USD',
    businessName: (row.business_name as string) ?? 'Feuoir',
    taxRate:      (row.tax_rate      as number) ?? 0,
  };
}

export function settingsToDb(s: Partial<Settings>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (s.whatsapp     !== undefined) out.whatsapp      = s.whatsapp;
  if (s.shippingCost !== undefined) out.shipping_cost = s.shippingCost;
  if (s.currency     !== undefined) out.currency      = s.currency;
  if (s.businessName !== undefined) out.business_name = s.businessName;
  if (s.taxRate      !== undefined) out.tax_rate      = s.taxRate;
  return out;
}
