import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReveal } from '../lib/useReveal';
import { whatsappLink } from '../lib/whatsapp';
import {
  BUDGET_RANGES,
  COMMISSION_SUBJECTS,
  EMPTY_REQUEST,
  composeMessage,
  validate,
} from '../content/commissions';
import type { CommissionRequest, RequiredField } from '../content/commissions';
import type { Settings } from '../types';

/** Linea fina bajo el campo, sin caja: el registro de la casa no lleva marcos. */
const FIELD =
  'w-full bg-transparent border-b border-ink/20 py-3 text-sm outline-none transition-colors focus:border-ink placeholder:text-ink/30';
const LABEL = 'block text-[10px] tracking-[0.26em] uppercase text-ink/45 mb-1';

function Field({
  label,
  error,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <div className="mb-8">
      <label className={LABEL} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-2 text-[10px] tracking-[0.2em] uppercase text-ink/70" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Commissions({ settings }: { settings: Settings }) {
  const { t } = useTranslation();
  const { ref, revealed } = useReveal<HTMLDivElement>();
  const id = useId();

  const [request, setRequest] = useState<CommissionRequest>(EMPTY_REQUEST);
  // Los errores no se calculan en cada tecla: marcar en rojo un correo a medio
  // escribir es hostil. Aparecen al intentar enviar y se recalculan desde ahi.
  const [errors, setErrors] = useState<RequiredField[] | null>(null);

  const set = <K extends keyof CommissionRequest>(key: K, value: CommissionRequest[K]) => {
    const next = { ...request, [key]: value };
    setRequest(next);
    if (errors) setErrors(validate(next));
  };

  const errorFor = (field: RequiredField) =>
    errors?.includes(field) ? t(`commissions.error.${field}`) : undefined;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const missing = validate(request);
    setErrors(missing);
    if (missing.length > 0) {
      document.getElementById(`${id}-${missing[0]}`)?.focus();
      return;
    }

    const message = composeMessage(
      request,
      {
        title: t('commissions.messageTitle'),
        subject: t('commissions.subject'),
        size: t('commissions.size'),
        intention: t('commissions.intention'),
        budget: t('commissions.budget'),
        name: t('commissions.name'),
        email: t('commissions.email'),
      },
      {
        subject: t(`commissions.subjectOption.${request.subject}`),
        budget: t(`commissions.budgetOption.${request.budget}`),
      }
    );

    // Se envia por el mismo canal que ya usa el checkout, en vez de montar un
    // endpoint propio: hoy no hay backend conectado, y un formulario que no
    // llega a ninguna parte es peor que no tenerlo. Cuando exista la API, el
    // cambio es sustituir esta llamada.
    const link = whatsappLink(settings.whatsapp, message);
    if (link) window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="section--museum min-h-screen px-6 md:px-10 pt-32 md:pt-44 pb-24 md:pb-40">
      <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-x-6 gap-y-16">

        <header ref={ref} className="reveal col-span-12 md:col-span-5" data-revealed={revealed}>
          <h1 className="text-4xl md:text-6xl tracking-[-0.03em] mb-8">
            {t('commissions.title')}
          </h1>
          <p className="max-w-[32ch] text-sm leading-relaxed text-ink/55">
            {t('commissions.lead')}
          </p>
        </header>

        {/* `noValidate`: la validacion la hace el componente para poder mostrar
            los mensajes en el idioma activo. Los globos del navegador salen en el
            idioma del sistema, que no tiene por que coincidir. */}
        <form onSubmit={submit} noValidate className="col-span-12 md:col-span-6 md:col-start-7">
          <Field label={t('commissions.subject')} htmlFor={`${id}-subject`}>
            <select
              id={`${id}-subject`}
              className={FIELD}
              value={request.subject}
              onChange={(e) => set('subject', e.target.value as CommissionRequest['subject'])}
            >
              {COMMISSION_SUBJECTS.map((option) => (
                <option key={option} value={option}>
                  {t(`commissions.subjectOption.${option}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('commissions.size')} htmlFor={`${id}-size`}>
            <input
              id={`${id}-size`}
              className={FIELD}
              value={request.size}
              onChange={(e) => set('size', e.target.value)}
              placeholder={t('commissions.sizeHint')}
            />
          </Field>

          <Field
            label={t('commissions.intention')}
            htmlFor={`${id}-intention`}
            error={errorFor('intention')}
          >
            <textarea
              id={`${id}-intention`}
              rows={5}
              className={`${FIELD} resize-none`}
              value={request.intention}
              onChange={(e) => set('intention', e.target.value)}
              aria-invalid={errors?.includes('intention') || undefined}
              placeholder={t('commissions.intentionHint')}
            />
          </Field>

          <Field label={t('commissions.budget')} htmlFor={`${id}-budget`}>
            <select
              id={`${id}-budget`}
              className={FIELD}
              value={request.budget}
              onChange={(e) => set('budget', e.target.value as CommissionRequest['budget'])}
            >
              {BUDGET_RANGES.map((option) => (
                <option key={option} value={option}>
                  {t(`commissions.budgetOption.${option}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('commissions.name')} htmlFor={`${id}-name`} error={errorFor('name')}>
            <input
              id={`${id}-name`}
              className={FIELD}
              value={request.name}
              onChange={(e) => set('name', e.target.value)}
              aria-invalid={errors?.includes('name') || undefined}
              autoComplete="name"
            />
          </Field>

          <Field label={t('commissions.email')} htmlFor={`${id}-email`} error={errorFor('email')}>
            <input
              id={`${id}-email`}
              type="email"
              className={FIELD}
              value={request.email}
              onChange={(e) => set('email', e.target.value)}
              aria-invalid={errors?.includes('email') || undefined}
              autoComplete="email"
            />
          </Field>

          {settings.whatsapp ? (
            <button
              type="submit"
              className="inline-flex items-center gap-3 text-[11px] tracking-[0.25em] uppercase border-b border-ink/40 pb-1.5 transition-opacity hover:opacity-60"
            >
              {t('commissions.send')}
              <span aria-hidden="true">↗</span>
            </button>
          ) : (
            /* Sin canal configurado no se ofrece un boton que no hace nada. */
            <p className="text-[10px] tracking-[0.2em] uppercase text-ink/45" role="status">
              {t('commissions.noChannel')}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
