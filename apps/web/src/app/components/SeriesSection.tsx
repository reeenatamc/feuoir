import { useTranslation } from 'react-i18next';
import { useReveal } from '../lib/useReveal';
import type { SeriesCatalogState } from '../lib/useCatalog';
import { CatalogStatus } from './CatalogStatus';
import { ObjectGrid } from './ObjectGrid';
import { seriesCode, pad2 } from '../content/series';

/**
 * La serie vigente, dentro de la home.
 *
 * Cambio de ritmo tras el hero: de la sala oscura a una clara, casi
 * museografica. La seccion redefine los tokens localmente, asi los componentes
 * de dentro siguen usando `bg-surface` y `text-ink` sin saber en que sala estan.
 *
 * El reparto de las piezas no vive aqui sino en <ObjectGrid>, que comparte con
 * la pagina de objetos: si cada una llevara su copia, divergirian.
 *
 * Recibe el catalogo en vez de pedirlo: el hero, que la contiene, ya muestra los
 * mismos contadores y por tanto ya lo pidio. Con un hook propio la home haria
 * dos veces las mismas dos consultas para pintar el mismo numero dos veces.
 */
export function SeriesSection({ catalog }: { catalog: SeriesCatalogState }) {
  const { t } = useTranslation();
  const { ref, revealed } = useReveal<HTMLDivElement>();
  const { status, series, objects } = catalog;

  return (
    <section
      id="series-001"
      className="section--museum py-24 md:py-40 px-6 md:px-10"
      aria-labelledby="series-001-title"
    >
      <div className="max-w-[1600px] mx-auto">
        <div ref={ref} className="reveal mb-16 md:mb-28" data-revealed={revealed}>
          {series && (
            <p className="text-[10px] tracking-[0.26em] uppercase text-ink/40 mb-5 tabular-nums">
              {seriesCode(series.number, series.year)}
            </p>
          )}

          {/* El titular necesita el numero de serie, asi que mientras no llega
              se anuncia la seccion por lo que es. El `id` no cambia: es el
              ancla del enlace del indice y no puede depender de una respuesta. */}
          <h2 id="series-001-title" className="text-4xl md:text-7xl tracking-[-0.03em] mb-6">
            {series ? t('series.title', { number: series.number }) : t('feuoirNav.objects')}
          </h2>

          {series && (
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-[10px] tracking-[0.26em] uppercase text-ink/45 tabular-nums">
              <span>
                {pad2(series.counts.available)} {t('state.available')}
              </span>
              <span>
                {pad2(series.counts.archived)} {t('state.archived')}
              </span>
            </div>
          )}
        </div>

        {status === 'ready' ? (
          <ObjectGrid objects={objects} />
        ) : (
          <CatalogStatus status={status} />
        )}
      </div>
    </section>
  );
}
