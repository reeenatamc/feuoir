import { useTranslation } from 'react-i18next';
import { useTransitionNavigate } from '../lib/navigation';
import { useReveal } from '../lib/useReveal';
import { objectCode } from '../content/series';
import type { FeuoirObject } from '../content/objects';
import { objectRoute } from '../content/vocabulary';

/**
 * Reparto editorial de las piezas.
 *
 * En vez de una retícula pareja, cada posicion del ciclo tiene su propio ancho y
 * su desplazamiento vertical. El patron se repite cada cuatro piezas, de modo
 * que la pagina respira como una revista y no como un catalogo, pero sigue
 * cayendo sobre la misma cuadricula de doce columnas: la tension es deliberada,
 * no ruido.
 */
const LAYOUT = [
  { span: 'md:col-span-7', offset: '' },
  { span: 'md:col-span-4 md:col-start-9', offset: 'md:mt-32' },
  { span: 'md:col-span-5 md:col-start-2', offset: 'md:mt-16' },
  { span: 'md:col-span-6 md:col-start-7', offset: 'md:-mt-8' },
];

/** Proporcion de la imagen, alternada para que la columna no quede monotona. */
const RATIOS = ['aspect-[4/5]', 'aspect-[3/4]', 'aspect-square', 'aspect-[4/5]'];

function ObjectTile({ object, index }: { object: FeuoirObject; index: number }) {
  const { t } = useTranslation();
  const navigate = useTransitionNavigate();
  const { ref, revealed } = useReveal<HTMLLIElement>();
  const slot = LAYOUT[index % LAYOUT.length];

  return (
    <li ref={ref} className={`col-span-12 ${slot.span} ${slot.offset}`}>
      <button
        onClick={() => navigate(objectRoute(object.number))}
        // `group` habilita el hover de la fotografia desde el contenedor, para
        // que reaccione igual apuntando a la imagen o al pie.
        className="group block w-full text-left reveal"
        data-revealed={revealed}
        style={{ transitionDelay: `${(index % LAYOUT.length) * 90}ms` }}
      >
        <div className={`relative overflow-hidden bg-surface-sunken ${RATIOS[index % RATIOS.length]}`}>
          {object.image ? (
            <img
              src={object.image}
              alt={object.name}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[var(--motion-slow)] ease-out group-hover:scale-[1.03]"
            />
          ) : (
            /* Sin fotografia todavia. Un panel tonal con el codigo se lee como
               una ficha de inventario, no como una imagen rota. */
            <span className="absolute bottom-4 left-4 text-[10px] tracking-[0.26em] uppercase text-ink/25">
              {objectCode(object.series, object.number, object.year)}
            </span>
          )}
        </div>

        {/* Solo numero, nombre y estado. Ni precio ni boton: en el archivo el
            titular de una pieza es su numero, y el comercio va despues. */}
        <div className="mt-4 flex items-baseline gap-4">
          <span className="text-[10px] tracking-[0.26em] tabular-nums text-ink/40">
            {object.number}
          </span>
          <span className="flex-1 text-sm tracking-[-0.005em] transition-opacity group-hover:opacity-60">
            {object.name}
          </span>
          <span className="text-[10px] tracking-[0.26em] uppercase text-ink/40">
            {t(`state.${object.state}`)}
          </span>
        </div>
      </button>
    </li>
  );
}

/**
 * Retícula editorial de piezas.
 *
 * Vive aparte de quien la muestra porque la comparten la seccion de la home y la
 * pagina de objetos: si cada una llevara su copia, el reparto y el pie de cada
 * pieza divergirian en cuanto se tocara uno de los dos.
 */
export function ObjectGrid({ objects }: { objects: FeuoirObject[] }) {
  return (
    <ul className="grid grid-cols-12 gap-x-6 gap-y-16 md:gap-y-28">
      {objects.map((object, i) => (
        <ObjectTile key={object.number} object={object} index={i} />
      ))}
    </ul>
  );
}
