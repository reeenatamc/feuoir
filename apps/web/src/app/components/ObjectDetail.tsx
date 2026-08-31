import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { TransitionLink } from '../lib/navigation';
import { useReveal } from '../lib/useReveal';
import { useObjectRecord } from '../lib/useCatalog';
import { AddToBag } from './AddToBag';
import { CatalogStatus } from './CatalogStatus';
import { ObjectPhoto } from './ObjectPhoto';
import type { ObjectImage } from '../content/images';
import type { FeuoirObject, SaleVariant } from '../content/objects';
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

/** La documentacion ocupa siete de doce columnas, y toda la pantalla en movil. */
const DOC_SIZES = '(max-width: 767px) 100vw, 58vw';

/**
 * El guion de documentacion aplicado a las fotos que llegaron.
 *
 * Con fotos, cada una toma la proporcion de la vista que le toca por orden; sin
 * ellas, quedan las cinco vistas previstas como huecos nombrados. Es el mismo
 * recorrido en los dos casos: la ficha documenta la pieza aunque todavia no se
 * haya fotografiado.
 */
function documentation(images: ObjectImage[]) {
  const total = images.length > 0 ? images.length : VIEWS.length;

  return Array.from({ length: total }, (_, index) => ({
    // La proporcion cicla para que la columna no sea un pasillo de rectangulos
    // identicos, pero el nombre no: el guion nombra cinco vistas, y llamar
    // "Textura" a la septima fotografia seria inventarle un papel.
    ratio: VIEWS[index % VIEWS.length].ratio,
    key: VIEWS[index]?.key ?? null,
    image: images[index] ?? null,
  }));
}

/** Fila de especificacion: etiqueta a la izquierda, dato a la derecha. */
function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-ink/10 py-3">
      <dt className="text-[10px] tracking-[0.26em] uppercase text-ink/40">{label}</dt>
      <dd className="text-right text-sm tabular-nums">{value}</dd>
    </div>
  );
}

function DocumentationView({
  view,
  index,
}: {
  view: ReturnType<typeof documentation>[number];
  index: number;
}) {
  const { t } = useTranslation();
  const { ref, revealed } = useReveal<HTMLDivElement>();

  return (
    <figure ref={ref} className="reveal" data-revealed={revealed}>
      <div className={`relative overflow-hidden bg-surface-sunken ${view.ratio}`}>
        {view.image && (
          <ObjectPhoto
            image={view.image}
            sizes={DOC_SIZES}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {/* Sin fotografia todavia se nombra la vista que falta en vez de dejar
            un hueco mudo, y con ella el pie sigue numerando el recorrido: la
            ficha se lee igual antes y despues de la sesion de fotos. */}
        <figcaption className="absolute bottom-4 left-4 text-[10px] tracking-[0.26em] uppercase text-ink/30">
          {String(index + 1).padStart(2, '0')}
          {view.key ? ` — ${t(`object.view.${view.key}`)}` : ''}
        </figcaption>
      </div>
    </figure>
  );
}

/**
 * La accion de la ficha, que depende del estado de la pieza.
 *
 * Una pieza disponible se agrega a la bolsa; una archivada o un encargo privado
 * no se venden, y lo unico que cabe ofrecer es la conversacion. La tercera rama
 * es la incomoda y por eso existe: la pieza esta a la venta pero no se pudo
 * consultar su variante, y sin ella no hay nada que agregar. Ofrecer el boton
 * igual seria ofrecer uno que falla al pulsarlo.
 */
function ObjectAction({
  object,
  variant,
}: {
  object: FeuoirObject;
  variant: SaleVariant | null;
}) {
  const { t } = useTranslation();

  if (object.state !== 'available') {
    return (
      <TransitionLink
        to={ROUTES.commissions}
        className="inline-flex items-center gap-3 text-[11px] tracking-[0.25em] uppercase border-b border-ink/40 pb-1.5 transition-opacity hover:opacity-60"
      >
        {t('object.requestCommission')}
        <span aria-hidden="true">↗</span>
      </TransitionLink>
    );
  }

  if (!variant) {
    return (
      <p role="status" className="text-sm text-ink/55">
        {t('bag.unavailable')}
      </p>
    );
  }

  return <AddToBag variant={variant} />;
}

function ObjectRecord({
  object,
  variant,
}: {
  object: FeuoirObject;
  variant: SaleVariant | null;
}) {
  const { t } = useTranslation();

  // El backend manda claves (`steel`), no nombres: el texto visible lo pone
  // i18n, para que el mismo dato se lea en el idioma de quien mira.
  const materials = object.materials.map((m) => t(`material.${m}`)).join(' / ');
  const views = documentation(object.images);

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

          {/* Tratamiento y edicion pueden no existir. Se omite la fila en vez de
              escribir un guion: una ficha de museo no declara campos vacios. */}
          <dl className="mb-10">
            <Spec label={t('object.series')} value={`${object.series} / ${object.year}`} />
            <Spec label={t('object.materials')} value={materials} />
            {object.treatment && (
              <Spec
                label={t('object.treatment')}
                value={t('object.treatmentThermal', { number: object.treatment.number })}
              />
            )}
            <Spec label={t('object.finish')} value={t('object.finishIndividual')} />
            {object.edition && (
              <Spec
                label={t('object.edition')}
                value={`${object.edition.index} / ${object.edition.of}`}
              />
            )}
            <Spec label={t('object.origin')} value={t('series.origin')} />
          </dl>

          <p className="text-[10px] tracking-[0.26em] uppercase mb-8">
            {t(`state.${object.state}`)}
          </p>

          {/* El precio aparece solo aqui, y sin protagonismo: en el archivo el
              titular de una pieza es su numero, no su importe.
              El importe se imprime tal como llego, sin pasar por `Number`: es
              texto decimal exacto, y convertirlo para volver a mostrarlo solo
              puede empeorarlo. Sin moneda no se publica: una cifra sola no dice
              cuanto cuesta la pieza. */}
          {object.price && variant && (
            <p className="text-sm tabular-nums mb-8">
              {object.price} {variant.currency}
            </p>
          )}

          <ObjectAction object={object} variant={variant} />
        </header>

        <div className="col-span-12 md:col-span-7 md:col-start-6">
          <h2 className="text-[10px] tracking-[0.26em] uppercase text-ink/40 mb-8">
            {t('object.documentation')}
          </h2>
          <div className="space-y-6 md:space-y-10">
            {/* La clave es la foto cuando la hay: con mas fotos que vistas
                previstas, el nombre de la vista se repite y dejaria de ser una. */}
            {views.map((view, i) => (
              <DocumentationView key={view.image?.src ?? view.key} view={view} index={i} />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

/** Contenedor de los avisos: el mismo hueco que ocuparia la ficha. */
function Notice({ children }: { children: ReactNode }) {
  return (
    <section className="section--museum min-h-screen px-6 md:px-10 pt-40 pb-24">
      <div className="max-w-[1600px] mx-auto">{children}</div>
    </section>
  );
}

export function ObjectDetail() {
  const { number } = useParams<{ number: string }>();
  const { t } = useTranslation();
  const { status, object, variant } = useObjectRecord(number);

  // Tres desenlaces y ninguno es una pagina en blanco: se esta pidiendo, no se
  // pudo pedir, o se pidio y esa pieza no existe. Solo el ultimo es culpa del
  // numero de la URL, y es el unico que ofrece volver a la serie.
  if (status !== 'ready') {
    return (
      <Notice>
        <CatalogStatus status={status} />
      </Notice>
    );
  }

  if (!object) {
    return (
      <Notice>
        <p className="text-sm text-ink/55 mb-8">{t('object.notFound')}</p>
        <TransitionLink
          to={ROUTES.objects}
          className="text-[11px] tracking-[0.25em] uppercase border-b border-ink/40 pb-1.5"
        >
          {t('object.backToSeries')}
        </TransitionLink>
      </Notice>
    );
  }

  return <ObjectRecord object={object} variant={variant} />;
}
