import { Injectable } from "@nestjs/common";
import type { PaymentProvider } from "@feuoir/shared";
import { PaymentProviderPort } from "../domain/payment.ports.js";

/**
 * `wa.me` necesita el numero del negocio en la URL. Sin el, el link abre
 * WhatsApp con el mensaje pero sin destinatario: el cliente tiene que elegir a
 * mano a quien mandarselo, asi que en la practica el checkout no llegaba a nadie.
 *
 * Se toma de la env `WHATSAPP_PHONE` (formato internacional, solo digitos).
 */
@Injectable()
export class WhatsAppPaymentProvider implements PaymentProviderPort {
  readonly name: PaymentProvider = "whatsapp";

  async createCheckoutPayload(input: { orderId: string; amount: number; currency: string }) {
    const externalReference = `wa-${input.orderId}`;
    const text = encodeURIComponent(
      `Hola! Quiero pagar la orden ${input.orderId}. Total: ${input.amount} ${input.currency}`
    );

    const phone = (process.env.WHATSAPP_PHONE ?? "").replace(/\D/g, "");
    const checkoutUrl = `https://wa.me/${phone}?text=${text}`;

    return { externalReference, checkoutUrl };
  }
}
