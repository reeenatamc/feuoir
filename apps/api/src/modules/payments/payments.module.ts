import { Module } from "@nestjs/common";
import { PaymentsController } from "./presentation/payments.controller.js";
import { CreatePaymentAttemptUseCase } from "./application/create-payment-attempt.use-case.js";
import { PAYMENT_PROVIDER, PAYMENT_ATTEMPT_REPOSITORY } from "./domain/payment.ports.js";
import { WhatsAppPaymentProvider } from "./infrastructure/whatsapp-payment.provider.js";
import { InMemoryPaymentAttemptRepository } from "./infrastructure/in-memory-payment-attempt.repository.js";

@Module({
  controllers: [PaymentsController],
  providers: [
    CreatePaymentAttemptUseCase,
    { provide: PAYMENT_PROVIDER, useClass: WhatsAppPaymentProvider },
    { provide: PAYMENT_ATTEMPT_REPOSITORY, useClass: InMemoryPaymentAttemptRepository }
  ]
})
export class PaymentsModule {}
