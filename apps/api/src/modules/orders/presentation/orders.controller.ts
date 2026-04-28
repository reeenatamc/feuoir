import { Body, Controller, Post } from "@nestjs/common";
import { z } from "zod";
import { CreateOrderUseCase } from "../application/create-order.use-case.js";

const createOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  subtotalAmount: z.number().positive(),
  totalAmount: z.number().positive(),
  currency: z.string().length(3)
});

@Controller("orders")
export class OrdersController {
  constructor(private readonly createOrderUseCase: CreateOrderUseCase) {}

  @Post()
  async create(@Body() body: unknown) {
    const input = createOrderSchema.parse(body);
    return this.createOrderUseCase.execute(input);
  }
}
