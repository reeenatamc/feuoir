import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { TransitionLink } from '../lib/navigation';
import { useReveal } from '../lib/useReveal';
import { findObject } from '../content/objects';
import type { FeuoirObject } from '../content/objects';
import { objectCode } from '../content/series';
import { ROUTES } from '../content/vocabulary';

/**
 * Vistas que documentan una pieza, en el orden en que se recorren.
 *
 * Es una lista y no cinco bloques escritos a mano porque toda pieza se fotografia
 * igual: cambiar el guion de documentacion tiene que ser editar este arreglo, no
 * recorrer el JSX. Las proporciones alternan para que la columna no sea un
 * pasillo de rectangulos identicos.
 */
const VIEWS = [
  { key: 'full', ratio: 'aspect-[4/5]' },
  { key: 'texture', ratio: 'aspect-[3/2]' },
  { key: 'seams', ratio: 'aspect-[3/2]' },
  { key: 'interior', ratio: 'aspect-[4/5]' },
  { key: 'label', ratio: 'aspect-square' },
] as const;

/** Fila de especificacion: etiqueta a la izquierda, dato a la derecha. */
function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-ink/10 py-3">
      <dt className="text-[10px] tracking-[0.26em] uppercase text-ink/40">{label}</dt>
      <dd className="text-right text-sm tabular-nums">{value}</dd>
    </div>
  );
}

function DocumentationView({ view, index }: { view: (typeof VIEWS)[number]; index: number }) {
  const { t } = useTranslation();
  const { ref, revealed } = useReveal<HTMLDivElement>();

  return (
    <figure ref={ref} className="reveal" data-revealed={revealed}>
      <div className={`relative overflow-hidden bg-surface-sunken ${view.ratio}`}>
        {/* Sin fotografia todavia. Se nombra la vista que falta en vez de dejar
            un hueco mudo: la ficha sigue documentando aunque no haya imagen. */}
        <figcaption className="absolute bottom-4 left-4 text-[10px] tracking-[0.26em] uppercase text-ink/30">
          {String(index + 1).padStart(2, '0')} — {t(`object.view.${view.key}`)}
        </figcaption>
      </div>
    </figure>
  );
}

function ObjectRecord({ object }: { object: FeuoirObject }) {
  const { t } = useTranslation();

  const materials = object.materials.map((m) => t(`material.${m}`)).join(' / ');
  const treatment = t('object.treatmentThermal', { number: object.treatment.number });
  const edition = `${object.edition.index} / ${object.edition.of}`;

  return (
    <article className="section--museum min-h-screen px-6 md:px-10 pt-32 md:pt-44 pb-24 md:pb-40">
      <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-x-6 gap-y-16">

        {/* Ficha. Se queda fija mientras la documentacion se recorre al lado: el
            dato tiene que estar a la vista cuando mirás la fotografia, no a un
            scroll de distancia. */}
        <header className="col-span-12 md:col-span-4 md:sticky md:top-32 md:self-start">
          <p className="text-[10px] tracking-[0.26em] uppercase text-ink/40 mb-4">
            {objectCode(object.series, object.number, object.year)}
          </p>

          <h1 className="text-3xl md:text-5xl tracking-[-0.03em] mb-2">
            {t('object.label')} {object.number}
          </h1>
          <p className="text-sm text-ink/55 mb-10">{object.name}</p>

          <dl className="mb-10">
            <Spec label={t('object.series')} value={`${object.series} / ${object.year}`} />
            <Spec label={t('object.materials')} value={materials} />
            <Spec label={t('object.treatment')} value={treatment} />
            <Spec label={t('object.finish')} value={t('object.finishIndividual')} />
            <Spec label={t('object.edition')} value={edition} />
            <Spec label={t('object.origin')} value={t('series.origin')} />
          </dl>

          <p className="text-[10px] tracking-[0.26em] uppercase mb-8">
            {t(`state.${object.state}`)}
          </p>

          {/* El precio aparece solo aqui, y sin protagonismo: en el archivo el
              titular de una pieza es su numero, no su importe. */}
          {object.state === 'available' && object.price && (
            <p className="text-sm tabular-nums mb-8">
              {object.price.amount} {object.price.currency}
            </p>
          )}

          <TransitionLink
            to={object.state === 'available' ? ROUTES.bag : ROUTES.commissions}
            className="inline-flex items-center gap-3 text-[11px] tracking-[0.25em] uppercase border-b border-ink/40 pb-1.5 transition-opacity hover:opacity-60"
          >
            {object.state === 'available' ? t('object.acquire') : t('object.requestCommission')}
            <span aria-hidden="true">↗</span>
          </TransitionLink>
        </header>

        <div className="col-span-12 md:col-span-7 md:col-start-6">
          <h2 className="text-[10px] tracking-[0.26em] uppercase text-ink/40 mb-8">
            {t('object.documentation')}
          </h2>
          <div className="space-y-6 md:space-y-10">
            {VIEWS.map((view, i) => (
              <DocumentationView key={view.key} view={view} index={i} />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ObjectDetail() {
  const { number } = useParams<{ number: string }>();
  const { t } = useTranslation();
  const object = number ? findObject(number) : undefined;

  if (!object) {
    return (
      <section className="section--museum min-h-screen px-6 md:px-10 pt-40 pb-24">
        <div className="max-w-[1600px] mx-auto">
          <p className="text-sm text-ink/55 mb-8">{t('object.notFound')}</p>
          <TransitionLink
            to={ROUTES.objects}
            className="text-[11px] tracking-[0.25em] uppercase border-b border-ink/40 pb-1.5"
          >
            {t('object.backToSeries')}
          </TransitionLink>
        </div>
      </section>
    );
  }

  return <ObjectRecord object={object} />;
}
