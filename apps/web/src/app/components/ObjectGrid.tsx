import { useTranslation } from 'react-i18next';
import { useTransitionNavigate } from '../lib/navigation';
import { useReveal } from '../lib/useReveal';
import { ObjectPhoto } from './ObjectPhoto';
import { objectCode } from '../content/series';
import type { FeuoirObject } from '../content/objects';
import { objectRoute } from '../content/vocabulary';

/**
 * Ancho que ocupa una foto de la retícula en cada punto de corte.
 *
 * El reparto va de cuatro a siete columnas de doce, asi que dos tercios del
 * ancho del contenedor es la aproximacion honesta; por debajo de `md` va de
 * nueve a doce columnas, que sobre un contenedor de ancho completo es alrededor
 * de nueve decimos de la ventana. Se declara aqui, junto al reparto que lo
 * justifica.
 */
const GRID_SIZES = '(max-width: 767px) 90vw, 66vw';

/**
 * Reparto editorial de las piezas.
 *
 * En vez de una retícula pareja, cada posicion del ciclo tiene su propio ancho y
 * su desplazamiento vertical. El patron se repite cada cuatro piezas, de modo
 * que la pagina respira como una revista y no como un catalogo, pero sigue
 * cayendo sobre la misma cuadricula de doce columnas: la tension es deliberada,
 * no ruido.
 *
 * Cada posicion declara su reparto en los DOS anchos. Prefijar solo con `md:`
 * dejaba el movil con cinco piezas del mismo ancho, sin sangrar y sin
 * desplazamiento: se caian a la vez las tres fuentes de tension, y la pagina
 * pasaba de revista a lista. La cuadricula ya es de doce columnas en todos los
 * tamaños, asi que la version de movil no necesita nada nuevo -- solo decir en
 * la base lo que hasta ahora solo se decia desde `md`.
 *
 * El reparto de movil es mas contenido que el de escritorio a proposito: con 342
 * puntos de ancho util, alternar ancho completo con piezas de diez y nueve
 * columnas sangradas a un lado y al otro ya separa las piezas entre 342 y 250
 * puntos, y bajar mas empezaria a leerse como una miniatura. Los desplazamientos
 * verticales son pequeños por el mismo motivo: en una sola columna un salto de
 * escritorio se lee como un hueco.
 */
const LAYOUT = [
  { span: 'col-span-12 md:col-span-7', offset: '' },
  { span: 'col-span-10 col-start-3 md:col-span-4 md:col-start-9', offset: 'mt-6 md:mt-32' },
  { span: 'col-span-9 col-start-1 md:col-span-5 md:col-start-2', offset: '-mt-4 md:mt-16' },
  { span: 'col-span-10 col-start-2 md:col-span-6 md:col-start-7', offset: 'mt-10 md:-mt-8' },
];

/** Proporcion de la imagen, alternada para que la columna no quede monotona. */
const RATIOS = ['aspect-[4/5]', 'aspect-[3/4]', 'aspect-square', 'aspect-[4/5]'];

function ObjectTile({ object, index }: { object: FeuoirObject; index: number }) {
  const { t } = useTranslation();
  const navigate = useTransitionNavigate();
  const { ref, revealed } = useReveal<HTMLLIElement>();
  const slot = LAYOUT[index % LAYOUT.length];

  return (
    <li ref={ref} className={`${slot.span} ${slot.offset}`}>
      <button
        onClick={() => navigate(objectRoute(object.number))}
        // `group` habilita el hover de la fotografia desde el contenedor, para
        // que reaccione igual apuntando a la imagen o al pie.
        className="group block w-full text-left reveal"
        data-revealed={revealed}
        style={{ transitionDelay: `${(index % LAYOUT.length) * 90}ms` }}
      >
        <div className={`relative overflow-hidden bg-surface-sunken ${RATIOS[index % RATIOS.length]}`}>
          {object.images[0] ? (
            <ObjectPhoto
              image={object.images[0]}
              sizes={GRID_SIZES}
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
      {/* La clave es el slug y no el numero: el numero solo es unico dentro de
          una serie, y esta retícula va a mostrar mas de una. */}
      {objects.map((object, i) => (
        <ObjectTile key={object.slug} object={object} index={i} />
      ))}
    </ul>
  );
}
