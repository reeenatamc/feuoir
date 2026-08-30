import { useTranslation } from 'react-i18next';
import { useReveal } from '../lib/useReveal';
import { ObjectGrid } from './ObjectGrid';
import { CURRENT_SERIES, seriesCode, pad2 } from '../content/series';
import { SERIES_001_OBJECTS } from '../content/objects';

/**
 * La serie vigente, dentro de la home.
 *
 * Cambio de ritmo tras el hero: de la sala oscura a una clara, casi
 * museografica. La seccion redefine los tokens localmente, asi los componentes
 * de dentro siguen usando `bg-surface` y `text-ink` sin saber en que sala estan.
 *
 * El reparto de las piezas no vive aqui sino en <ObjectGrid>, que comparte con
 * la pagina de objetos: si cada una llevara su copia, divergirian.
 */
export function SeriesSection() {
  const { t } = useTranslation();
  const { ref, revealed } = useReveal<HTMLDivElement>();

  return (
    <section
      id="series-001"
      className="section--museum py-24 md:py-40 px-6 md:px-10"
      aria-labelledby="series-001-title"
    >
      <div className="max-w-[1600px] mx-auto">
        <div ref={ref} className="reveal mb-16 md:mb-28" data-revealed={revealed}>
          <p className="text-[10px] tracking-[0.26em] uppercase text-ink/40 mb-5 tabular-nums">
            {seriesCode(CURRENT_SERIES.number, CURRENT_SERIES.year)}
          </p>

          <h2 id="series-001-title" className="text-4xl md:text-7xl tracking-[-0.03em] mb-6">
            {t('series.title', { number: CURRENT_SERIES.number })}
          </h2>

          <div className="flex flex-wrap gap-x-8 gap-y-2 text-[10px] tracking-[0.26em] uppercase text-ink/45 tabular-nums">
            <span>
              {pad2(CURRENT_SERIES.counts.available)} {t('state.available')}
            </span>
            <span>
              {pad2(CURRENT_SERIES.counts.archived)} {t('state.archived')}
            </span>
          </div>
        </div>

        <ObjectGrid objects={SERIES_001_OBJECTS} />
      </div>
    </section>
  );
}
