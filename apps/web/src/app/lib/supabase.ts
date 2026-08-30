import { createClient } from '@supabase/supabase-js';
import type { Settings } from '../types';

/**
 * Falla en el arranque si falta configuracion, en vez de dejar que
 * `createClient(undefined, undefined)` reviente mas tarde con un error opaco.
 */
function requireEnv(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
  const value = import.meta.env[name];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `Falta la variable de entorno ${name}. Copiá apps/web/.env.example a apps/web/.env y completala.`
    );
  }
  return value;
}

export const supabase = createClient(
  requireEnv('VITE_SUPABASE_URL'),
  requireEnv('VITE_SUPABASE_ANON_KEY')
);

/** Loguea el error de Supabase con contexto y devuelve `true` si hubo error. */
export function logSupabaseError(context: string, error: unknown): boolean {
  if (!error) return false;
  console.error(`[supabase] ${context}:`, error);
  return true;
}

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
