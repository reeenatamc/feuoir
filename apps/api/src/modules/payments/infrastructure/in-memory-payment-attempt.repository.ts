import { Injectable } from "@nestjs/common";
import { PaymentAttempt } from "../domain/payment.entity.js";
import { PaymentAttemptRepository } from "../domain/payment.ports.js";

@Injectable()
export class InMemoryPaymentAttemptRepository implements PaymentAttemptRepository {
  private readonly attempts: PaymentAttempt[] = [];

  async save(attempt: PaymentAttempt): Promise<PaymentAttempt> {
    this.attempts.push(attempt);
    return attempt;
  }
}
