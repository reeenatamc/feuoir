import type { PaymentProvider } from "@feuoir/shared";
import { PaymentAttempt } from "./payment.entity.js";

export const PAYMENT_PROVIDER = Symbol("PAYMENT_PROVIDER");
export const PAYMENT_ATTEMPT_REPOSITORY = Symbol("PAYMENT_ATTEMPT_REPOSITORY");

export interface PaymentProviderPort {
  /**
   * Identidad del proveedor. El caso de uso escribia `provider: "whatsapp"`
   * hardcodeado aunque recibia el port por inyeccion: al enchufar Stripe o
   * Mercado Pago habria guardado igual "whatsapp" en cada intento de pago.
   */
  readonly name: PaymentProvider;

  createCheckoutPayload(input: {
    orderId: string;
    amount: number;
    currency: string;
  }): Promise<{ externalReference: string; checkoutUrl: string }>;
}

export interface PaymentAttemptRepository {
  save(attempt: PaymentAttempt): Promise<PaymentAttempt>;
}
