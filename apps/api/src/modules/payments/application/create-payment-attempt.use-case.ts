import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  PAYMENT_ATTEMPT_REPOSITORY,
  PAYMENT_PROVIDER,
  PaymentAttemptRepository,
  PaymentProviderPort
} from "../domain/payment.ports.js";
import { PaymentAttempt } from "../domain/payment.entity.js";

interface CreatePaymentAttemptInput {
  orderId: string;
  amount: number;
  currency: string;
}

@Injectable()
export class CreatePaymentAttemptUseCase {
  constructor(
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProviderPort,
    @Inject(PAYMENT_ATTEMPT_REPOSITORY) private readonly repository: PaymentAttemptRepository
  ) {}

  async execute(input: CreatePaymentAttemptInput) {
    const providerPayload = await this.provider.createCheckoutPayload(input);
    const attempt: PaymentAttempt = {
      id: randomUUID(),
      orderId: input.orderId,
      provider: "whatsapp",
      status: "pending",
      amount: input.amount,
      currency: input.currency,
      externalReference: providerPayload.externalReference,
      metadata: { checkoutUrl: providerPayload.checkoutUrl },
      createdAt: new Date()
    };
    const saved = await this.repository.save(attempt);
    return { attempt: saved, checkoutUrl: providerPayload.checkoutUrl };
  }
}
