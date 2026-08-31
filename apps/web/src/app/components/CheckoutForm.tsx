import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EMPTY_CHECKOUT, TAX_ID_KINDS, validate } from '../content/checkout';
import type { CheckoutField, CheckoutForm as FormValues } from '../content/checkout';
import type { CartFailure, Order } from '../content/cart';
import type { CheckoutOutcome } from '../lib/CartProvider';
import { BagNotice } from './BagNotice';
import { Field, FIELD } from './FormField';

/**
 * Los datos con los que la bolsa se convierte en orden.
 *
 * La direccion de envio se pide siempre. La de facturacion, solo cuando la bolsa
 * dice que hace falta: el backend publica `requires_tax_id` desde el carrito -- y
 * no solo al crear la orden -- precisamente para que el documento se pida en el
 * momento util y no aparezca como una sorpresa al confirmar. Aqui se aprovecha
 * ese aviso en vez de descubrir el requisito con un `400`.
 */
export function CheckoutForm({
  requiresTaxId,
  busy,
  onSubmit,
  onCreated,
  onBack,
}: {
  requiresTaxId: boolean;
  busy: boolean;
  onSubmit: (form: FormValues) => Promise<CheckoutOutcome>;
  onCreated: (order: Order) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const id = useId();

  const [form, setForm] = useState<FormValues>(EMPTY_CHECKOUT);
  // Igual que en los encargos: los errores no se calculan en cada tecla, porque
  // marcar en rojo un correo a medio escribir es hostil. Aparecen al intentar
  // confirmar y a partir de ahi se recalculan.
  const [errors, setErrors] = useState<CheckoutField[] | null>(null);
  const [failure, setFailure] = useState<{ failure: CartFailure; detail: string | null } | null>(null);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (errors) setErrors(validate(next, requiresTaxId));
  };

  const errorFor = (field: CheckoutField) =>
    errors?.includes(field) ? t(`checkout.error.${field}`) : undefined;

  const invalid = (field: CheckoutField) => errors?.includes(field) || undefined;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const missing = validate(form, requiresTaxId);
    setErrors(missing);

    if (missing.length > 0) {
      document.getElementById(`${id}-${missing[0]}`)?.focus();
      return;
    }

    setFailure(null);
    const outcome = await onSubmit(form);

    if (outcome.ok) {
      onCreated(outcome.order);
      return;
    }

    setFailure({ failure: outcome.failure, detail: outcome.detail });
  };

  return (
    // `noValidate`: la validacion la hace el componente para poder mostrar los
    // mensajes en el idioma activo. Los globos del navegador salen en el idioma
    // del sistema, que no tiene por que coincidir.
    <form onSubmit={submit} noValidate className="max-w-[46ch]">
      <h2 className="text-[10px] tracking-[0.26em] uppercase text-ink/40 mb-8">
        {t('checkout.title')}
      </h2>

      <Field label={t('checkout.name')} htmlFor={`${id}-name`} error={errorFor('name')}>
        <input
          id={`${id}-name`}
          className={FIELD}
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          aria-invalid={invalid('name')}
          autoComplete="name"
        />
      </Field>

      <Field label={t('checkout.email')} htmlFor={`${id}-email`} error={errorFor('email')}>
        <input
          id={`${id}-email`}
          type="email"
          className={FIELD}
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          aria-invalid={invalid('email')}
          autoComplete="email"
        />
      </Field>

      <Field label={t('checkout.phone')} htmlFor={`${id}-phone`}>
        <input
          id={`${id}-phone`}
          type="tel"
          className={FIELD}
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          autoComplete="tel"
        />
      </Field>

      <Field label={t('checkout.line1')} htmlFor={`${id}-line1`} error={errorFor('line1')}>
        <input
          id={`${id}-line1`}
          className={FIELD}
          value={form.line1}
          onChange={(e) => set('line1', e.target.value)}
          aria-invalid={invalid('line1')}
          autoComplete="address-line1"
        />
      </Field>

      <Field label={t('checkout.line2')} htmlFor={`${id}-line2`}>
        <input
          id={`${id}-line2`}
          className={FIELD}
          value={form.line2}
          onChange={(e) => set('line2', e.target.value)}
          autoComplete="address-line2"
        />
      </Field>

      <Field label={t('checkout.city')} htmlFor={`${id}-city`} error={errorFor('city')}>
        <input
          id={`${id}-city`}
          className={FIELD}
          value={form.city}
          onChange={(e) => set('city', e.target.value)}
          aria-invalid={invalid('city')}
          autoComplete="address-level2"
        />
      </Field>

      <Field label={t('checkout.state')} htmlFor={`${id}-state`}>
        <input
          id={`${id}-state`}
          className={FIELD}
          value={form.state}
          onChange={(e) => set('state', e.target.value)}
          autoComplete="address-level1"
        />
      </Field>

      <Field label={t('checkout.postalCode')} htmlFor={`${id}-postalCode`}>
        <input
          id={`${id}-postalCode`}
          className={FIELD}
          value={form.postalCode}
          onChange={(e) => set('postalCode', e.target.value)}
          autoComplete="postal-code"
        />
      </Field>

      {/* Codigo de dos letras y no un desplegable de paises: inventar la lista de
          a donde se envia seria decidir por el negocio, y `autocomplete="country"`
          es justamente el campo que el navegador rellena con el codigo ISO. */}
      <Field
        label={t('checkout.country')}
        htmlFor={`${id}-country`}
        hint={t('checkout.countryHint')}
        error={errorFor('country')}
      >
        <input
          id={`${id}-country`}
          className={`${FIELD} uppercase`}
          value={form.country}
          onChange={(e) => set('country', e.target.value.toUpperCase())}
          aria-invalid={invalid('country')}
          maxLength={2}
          autoComplete="country"
        />
      </Field>

      {requiresTaxId && (
        <fieldset className="border-t border-ink/10 pt-8 mb-2">
          <legend className="text-[10px] tracking-[0.26em] uppercase text-ink/40 mb-3">
            {t('checkout.billingTitle')}
          </legend>
          <p className="text-sm leading-relaxed text-ink/55 mb-8">{t('checkout.billingLead')}</p>

          <Field
            label={t('checkout.billingName')}
            htmlFor={`${id}-billingName`}
            error={errorFor('billingName')}
          >
            <input
              id={`${id}-billingName`}
              className={FIELD}
              value={form.billingName}
              onChange={(e) => set('billingName', e.target.value)}
              aria-invalid={invalid('billingName')}
            />
          </Field>

          <Field label={t('checkout.taxIdKind')} htmlFor={`${id}-taxIdKind`}>
            <select
              id={`${id}-taxIdKind`}
              className={FIELD}
              value={form.taxIdKind}
              onChange={(e) => set('taxIdKind', e.target.value as FormValues['taxIdKind'])}
            >
              {TAX_ID_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {t(`checkout.taxIdKindOption.${kind}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('checkout.taxId')} htmlFor={`${id}-taxId`} error={errorFor('taxId')}>
            <input
              id={`${id}-taxId`}
              className={FIELD}
              value={form.taxId}
              onChange={(e) => set('taxId', e.target.value)}
              aria-invalid={invalid('taxId')}
              inputMode="numeric"
            />
          </Field>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mt-4">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-3 text-[11px] tracking-[0.25em] uppercase border-b border-ink/40 pb-1.5 transition-opacity hover:opacity-60 disabled:opacity-35"
        >
          {busy ? t('checkout.submitting') : t('checkout.submit')}
          <span aria-hidden="true">↗</span>
        </button>

        <button
          type="button"
          onClick={onBack}
          className="text-[10px] tracking-[0.26em] uppercase text-ink/45 hover:text-ink transition-colors"
        >
          {t('checkout.back')}
        </button>
      </div>

      {failure && <BagNotice failure={failure.failure} detail={failure.detail} />}
    </form>
  );
}
