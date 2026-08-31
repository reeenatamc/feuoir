import { useTranslation } from 'react-i18next';
import type { CatalogStatus as Status } from '../lib/useCatalog';

/**
 * Lo que ocupa el lugar de las piezas cuando todavia no hay ninguna que pintar.
 *
 * Existe para que ninguna de las tres vistas del catalogo se quede en blanco
 * esperando, y para que las tres digan lo mismo: una pagina vacia no distingue
 * "esta cargando" de "el servidor no contesta" de "la serie no tiene piezas",
 * y son tres situaciones con tres respuestas distintas.
 *
 * El fallo se anuncia con `alert` y la espera con `status`: un lector de
 * pantalla interrumpe lo que esta leyendo para lo primero y no para lo segundo,
 * que es justamente la diferencia entre las dos.
 */
export function CatalogStatus({ status }: { status: Exclude<Status, 'ready'> }) {
  const { t } = useTranslation();

  if (status === 'error') {
    return (
      <div role="alert" className="max-w-[34ch] py-8">
        <p className="text-sm leading-relaxed">{t('catalog.unavailable')}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">{t('catalog.unavailableHint')}</p>
      </div>
    );
  }

  return (
    <p role="status" className="py-8 text-sm leading-relaxed text-ink/55">
      {t(status === 'empty' ? 'catalog.empty' : 'catalog.loading')}
    </p>
  );
}
