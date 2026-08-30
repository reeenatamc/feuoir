import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TransitionLink } from '../lib/navigation';
import { useReveal } from '../lib/useReveal';
import { SERIES_001_OBJECTS } from '../content/objects';
import type { FeuoirObject } from '../content/objects';
import { CURRENT_SERIES, objectCode, pad2 } from '../content/series';
import { objectRoute } from '../content/vocabulary';

/**
 * Una fila del archivo.
 *
 * Es un enlace y no un `div` con `onClick`: se enfoca con el teclado, se abre en
 * otra pestaña con el modificador, y el navegador anuncia a donde lleva. Un
 * archivo que solo responde al raton deja fuera a quien lo recorre de otra forma.
 */
function ArchiveRow({
  object,
  onFocusRow,
}: {
  object: FeuoirObject;
  onFocusRow: (object: FeuoirObject) => void;
}) {
  const { t } = useTranslation();
  const { ref, revealed } = useReveal<HTMLLIElement>();

  return (
    <li ref={ref} className="reveal" data-revealed={revealed}>
      <TransitionLink
        to={objectRoute(object.number)}
        // `focus` ademas de `mouseenter`: recorrer con Tab tiene que mover la
        // vista previa igual que recorrer con el raton.
        onMouseEnter={() => onFocusRow(object)}
        onFocus={() => onFocusRow(object)}
        className="group grid grid-cols-[3.5rem_1fr_auto] items-baseline gap-4 border-b border-ink/10 py-5 transition-colors hover:border-ink/40"
      >
        <span className="text-[10px] tracking-[0.26em] tabular-nums text-ink/40">
          {object.number}
        </span>
        <span className="text-sm md:text-base tracking-[-0.005em] transition-opacity group-hover:opacity-60">
          {object.name}
        </span>
        <span className="text-[10px] tracking-[0.26em] uppercase text-ink/40">
          {t(`state.${object.state}`)}
        </span>
      </TransitionLink>
    </li>
  );
}

/**
 * Vista previa de la pieza señalada.
 *
 * Ocupa un hueco fijo a la derecha en vez de seguir al cursor: perseguir el
 * raton obliga a recalcular posicion en cada movimiento y pide un cursor propio,
 * dos cosas que este proyecto descarta. Con un hueco fijo, el cambio entre
 * piezas es un fundido y nada mas.
 */
function ArchivePreview({ object }: { object: FeuoirObject | null }) {
  return (
    <div className="sticky top-32 aspect-[4/5] overflow-hidden bg-surface-sunken">
      {object && (
        <>
          {object.image && (
            <img
              src={object.image}
              alt={object.name}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {/* Sin fotografia todavia: el codigo se lee como ficha de inventario y
              no como una imagen que no cargo. */}
          <span className="absolute bottom-4 left-4 text-[10px] tracking-[0.26em] uppercase text-ink/30">
            {objectCode(object.series, object.number, object.year)}
          </span>
        </>
      )}
    </div>
  );
}

export function Archive() {
  const { t } = useTranslation();
  const { ref, revealed } = useReveal<HTMLDivElement>();

  // Arranca en la primera pieza y no en `null`: un hueco vacio hasta que alguien
  // pase el raton se lee como un fallo de carga.
  const [focused, setFocused] = useState<FeuoirObject>(SERIES_001_OBJECTS[0]);

  return (
    <section className="section--museum min-h-screen px-6 md:px-10 pt-32 md:pt-44 pb-24 md:pb-40">
      <div className="max-w-[1600px] mx-auto">
        <header ref={ref} className="reveal mb-16 md:mb-24" data-revealed={revealed}>
          <h1 className="text-4xl md:text-7xl tracking-[-0.03em] mb-6">
            {t('archivePage.title')}
          </h1>
          <p className="max-w-[34ch] text-sm leading-relaxed text-ink/55 mb-8">
            {t('archivePage.lead')}
          </p>
          <div className="flex gap-8 text-[10px] tracking-[0.26em] uppercase text-ink/40 tabular-nums">
            <span>
              {pad2(CURRENT_SERIES.counts.available)} {t('state.available')}
            </span>
            <span>
              {pad2(CURRENT_SERIES.counts.archived)} {t('state.archived')}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-x-6">
          {/* Lista limpia, sin retícula de producto: en el archivo la pieza es un
              registro con su numero y su estado, no una tarjeta de venta. */}
          <ul className="col-span-12 md:col-span-7">
            {SERIES_001_OBJECTS.map((object) => (
              <ArchiveRow key={object.number} object={object} onFocusRow={setFocused} />
            ))}
          </ul>

          {/* La vista previa no existe en tactil: sin cursor no hay nada que
              señalar, y ocuparia media pantalla sin poder cambiar nunca. */}
          <div className="hidden md:block md:col-span-4 md:col-start-9">
            <ArchivePreview object={focused} />
          </div>
        </div>
      </div>
    </section>
  );
}
