import { PaymentAttempt } from "./payment.entity.js";

export const PAYMENT_PROVIDER = Symbol("PAYMENT_PROVIDER");
export const PAYMENT_ATTEMPT_REPOSITORY = Symbol("PAYMENT_ATTEMPT_REPOSITORY");

export interface PaymentProviderPort {
  createCheckoutPayload(input: {
    orderId: string;
    amount: number;
    currency: string;
  }): Promise<{ externalReference: string; checkoutUrl: string }>;
}

export interface PaymentAttemptRepository {
  save(attempt: PaymentAttempt): Promise<PaymentAttempt>;
}
