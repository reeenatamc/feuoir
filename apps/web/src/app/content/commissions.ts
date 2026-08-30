/**
 * Encargos privados.
 *
 * FEUOIR no trata la personalizacion como un configurador: no hay un catalogo de
 * opciones que se combinan hasta llegar a un carrito. Un encargo se solicita, se
 * conversa y se acepta o no. De ahi que esto sean unas pocas claves y no un
 * arbol de variantes.
 */

/** Familias de pieza sobre las que se acepta un encargo. Deliberadamente pocas. */
export const COMMISSION_SUBJECTS = ['deck', 'apparel', 'lighter', 'other'] as const;
export type CommissionSubject = (typeof COMMISSION_SUBJECTS)[number];

/**
 * Tramos de presupuesto, no un importe exacto.
 *
 * Pedir una cifra cerrada obliga a quien pregunta a comprometerse antes de saber
 * que implica la pieza, y suele terminar en que no escribe. Un tramo basta para
 * saber si la conversacion tiene sentido.
 */
export const BUDGET_RANGES = ['under500', 'from500', 'from1000', 'undecided'] as const;
export type BudgetRange = (typeof BUDGET_RANGES)[number];

export interface CommissionRequest {
  subject: CommissionSubject;
  /** Talla o medida. Libre: una tabla y una prenda no se miden igual. */
  size: string;
  /** Que se busca con la pieza. Es el campo que de verdad importa. */
  intention: string;
  budget: BudgetRange;
  name: string;
  email: string;
}

export const EMPTY_REQUEST: CommissionRequest = {
  subject: 'deck',
  size: '',
  intention: '',
  budget: 'undecided',
  name: '',
  email: '',
};

/** Campos sin los que la solicitud no se puede responder. */
export type RequiredField = 'intention' | 'name' | 'email';

/**
 * Comprobacion de forma del correo, no de existencia.
 *
 * Deliberadamente laxa: las expresiones estrictas rechazan direcciones validas
 * (subdominios largos, `+` en el nombre, dominios nuevos) y el unico modo real
 * de saber si un correo existe es escribirle. Aqui solo se atajan los errores de
 * tecleo evidentes.
 */
export function isEmailShaped(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Campos que faltan o estan mal, para pintarlos y contarlos. */
export function validate(request: CommissionRequest): RequiredField[] {
  const missing: RequiredField[] = [];

  if (!request.intention.trim()) missing.push('intention');
  if (!request.name.trim()) missing.push('name');
  if (!isEmailShaped(request.email)) missing.push('email');

  return missing;
}

/**
 * Arma el mensaje que recibe el negocio.
 *
 * Recibe las etiquetas ya traducidas en vez de traducir aqui: mantiene la
 * funcion pura —se puede probar sin montar i18n— y hace que el mensaje llegue en
 * el idioma en que escribio quien pregunta, que de paso le dice al negocio en
 * que idioma responder.
 */
export function composeMessage(
  request: CommissionRequest,
  labels: Record<'title' | 'subject' | 'size' | 'intention' | 'budget' | 'name' | 'email', string>,
  values: { subject: string; budget: string }
): string {
  const lines = [
    labels.title,
    '',
    `${labels.subject}: ${values.subject}`,
    request.size.trim() ? `${labels.size}: ${request.size.trim()}` : null,
    `${labels.budget}: ${values.budget}`,
    '',
    `${labels.intention}:`,
    request.intention.trim(),
    '',
    `${labels.name}: ${request.name.trim()}`,
    `${labels.email}: ${request.email.trim()}`,
  ];

  return lines.filter((line) => line !== null).join('\n');
}
