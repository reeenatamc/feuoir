import { Body, Controller, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { CreatePaymentAttemptUseCase } from "../application/create-payment-attempt.use-case.js";

const createPaymentAttemptSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3)
});

@Controller("orders/:id/payment-attempts")
export class PaymentsController {
  constructor(private readonly createPaymentAttemptUseCase: CreatePaymentAttemptUseCase) {}

  @Post()
  async create(@Param("id") orderId: string, @Body() body: unknown) {
    const input = createPaymentAttemptSchema.parse(body);
    return this.createPaymentAttemptUseCase.execute({
      orderId,
      amount: input.amount,
      currency: input.currency
    });
  }
}
