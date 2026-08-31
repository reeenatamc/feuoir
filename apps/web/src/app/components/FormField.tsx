import type { ReactNode } from 'react';

/**
 * El registro de los formularios de la casa: linea fina bajo el campo, sin caja.
 *
 * Vive aparte porque lo comparten los encargos y el checkout, y son los dos
 * unicos formularios del sitio. Con una copia en cada uno, el dia que cambie el
 * tratamiento uno de los dos se queda como estaba.
 */
export const FIELD =
  'w-full bg-transparent border-b border-ink/20 py-3 text-sm outline-none transition-colors focus:border-ink placeholder:text-ink/30';

export const LABEL = 'block text-[10px] tracking-[0.26em] uppercase text-ink/45 mb-1';

export function Field({
  label,
  error,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  /** Aclaracion permanente, no un mensaje de fallo. */
  hint?: string;
  children: ReactNode;
  htmlFor: string;
}) {
  return (
    <div className="mb-8">
      <label className={LABEL} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-2 text-[10px] tracking-[0.2em] uppercase text-ink/35">{hint}</p>}
      {error && (
        <p className="mt-2 text-[10px] tracking-[0.2em] uppercase text-ink/70" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
