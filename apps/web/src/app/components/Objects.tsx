import { useTranslation } from 'react-i18next';
import { useReveal } from '../lib/useReveal';
import { useCurrentSeries } from '../lib/useCatalog';
import { CatalogStatus } from './CatalogStatus';
import { ObjectGrid } from './ObjectGrid';
import { seriesCode, pad2 } from '../content/series';

/**
 * Las piezas de la serie vigente, a pagina completa.
 *
 * Reemplaza a la retícula de producto que habia antes en esta ruta. La
 * diferencia no es de estilo: aquella listaba articulos con precio y boton de
 * compra, y esta lista piezas con su numero y su estado. El comercio aparece al
 * entrar en la ficha, no en el listado.
 *
 * Comparte el reparto con la seccion de la home via <ObjectGrid>; lo unico
 * propio es el encabezado, que aqui es el <h1> de la pagina.
 *
 * Sin filtros ni ordenaciones a proposito: son controles de tienda, y una serie
 * corta no los necesita. Cuando haya varias series, el corte natural sera por
 * serie y no por facetas.
 *
 * Las piezas llegan de `GET /api/series/current/` y de las piezas de esa serie.
 * La vista no sabe pedirlas: solo reparte lo que el hook le da y dice en que
 * punto esta.
 */
export function Objects() {
  const { t } = useTranslation();
  const { ref, revealed } = useReveal<HTMLDivElement>();
  const { status, series, objects } = useCurrentSeries();

  return (
    <section className="section--museum min-h-screen px-6 md:px-10 pt-32 md:pt-44 pb-24 md:pb-40">
      <div className="max-w-[1600px] mx-auto">
        <header ref={ref} className="reveal mb-16 md:mb-28" data-revealed={revealed}>
          {/* El codigo y los contadores solo aparecen con la serie cargada: son
              datos, y un `S— / —` mientras se espera se lee como un error. El
              titular y la entradilla, en cambio, son de la pagina y no de la
              serie, asi que estan desde el primer fotograma. */}
          {series && (
            <p className="text-[10px] tracking-[0.26em] uppercase text-ink/40 mb-5 tabular-nums">
              {seriesCode(series.number, series.year)}
            </p>
          )}

          <h1 className="text-4xl md:text-7xl tracking-[-0.03em] mb-6">
            {t('objectsPage.title')}
          </h1>

          <p className="max-w-[34ch] text-sm leading-relaxed text-ink/55 mb-8">
            {t('objectsPage.lead')}
          </p>

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
        </header>

        {status === 'ready' ? (
          <ObjectGrid objects={objects} />
        ) : (
          <CatalogStatus status={status} />
        )}
      </div>
    </section>
  );
}
