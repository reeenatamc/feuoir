import { Injectable } from "@nestjs/common";
import { PaymentProviderPort } from "../domain/payment.ports.js";

@Injectable()
export class WhatsAppPaymentProvider implements PaymentProviderPort {
  async createCheckoutPayload(input: { orderId: string; amount: number; currency: string }) {
    const externalReference = `wa-${input.orderId}`;
    const text = encodeURIComponent(
      `Hola! Quiero pagar la orden ${input.orderId}. Total: ${input.amount} ${input.currency}`
    );
    const checkoutUrl = `https://wa.me/?text=${text}`;
    return { externalReference, checkoutUrl };
  }
}
