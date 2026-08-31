import { useTranslation } from 'react-i18next';
import type { CartFailure } from '../content/cart';

/**
 * Lo que se muestra cuando una peticion de la bolsa no salio.
 *
 * Existe para que los tres sitios que pueden fallar -- agregar desde la ficha,
 * editar la bolsa, confirmar la compra -- digan lo mismo ante la misma causa, y
 * para que ninguno se conforme con "hubo un error": el contrato documenta cuatro
 * desenlaces distintos y cada uno se arregla de otra manera.
 *
 * Va en `alert` y no en `status`: un lector de pantalla interrumpe lo que esta
 * leyendo, que es lo que corresponde cuando la accion que se acaba de pedir no
 * ocurrio.
 */
export function BagNotice({ failure, detail }: { failure: CartFailure; detail: string | null }) {
  const { t } = useTranslation();

  return (
    <div role="alert" className="mt-6 border-l-2 border-ink/40 pl-4 py-1">
      <p className="text-sm leading-relaxed">{t(`bag.failure.${failure}`)}</p>

      {/* El motivo exacto lo redacta el servidor y no se traduce: es un dato, no
          texto de la interfaz. Se muestra debajo porque hay rechazos que solo el
          backend sabe explicar -- que variante no esta a la venta, que documento
          esta mal formado -- y perderlos deja sin saber que corregir. */}
      {detail && <p className="mt-1.5 text-[13px] leading-relaxed text-ink/55">{detail}</p>}
    </div>
  );
}
