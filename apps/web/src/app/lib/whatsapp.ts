/**
 * Enlace de WhatsApp hacia el negocio.
 *
 * `wa.me` exige el numero en formato internacional y **solo digitos**: con `+`,
 * espacios o guiones abre el chat sin destinatario, y el mensaje no llega a
 * nadie. Por eso se normaliza aqui y no en cada sitio que arma un enlace.
 *
 * Devuelve `null` cuando no hay numero configurado, para que quien lo use tenga
 * que decidir explicitamente que mostrar en ese caso en vez de generar un enlace
 * roto.
 */
export function whatsappLink(phone: string | undefined, message: string): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
