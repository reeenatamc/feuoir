import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ORDER_REPOSITORY, OrderRepository } from "../domain/order.repository.js";
import { Order } from "../domain/order.entity.js";

interface CreateOrderInput {
  customerId?: string;
  subtotalAmount: number;
  totalAmount: number;
  currency: string;
}

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    const now = new Date();
    const order: Order = {
      id: randomUUID(),
      orderNumber: `FO-${now.getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`,
      customerId: input.customerId ?? null,
      status: "pending_whatsapp",
      paymentStatus: "pending",
      currency: input.currency,
      subtotalAmount: input.subtotalAmount,
      totalAmount: input.totalAmount,
      createdAt: now
    };

    return this.orderRepository.save(order);
  }
}
