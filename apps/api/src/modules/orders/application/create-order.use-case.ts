import { Inject, Injectable } from "@nestjs/common";
import { randomBytes, randomUUID } from "node:crypto";
import { ORDER_REPOSITORY, OrderRepository } from "../domain/order.repository.js";
import { Order } from "../domain/order.entity.js";

interface CreateOrderInput {
  customerId?: string;
  subtotalAmount: number;
  totalAmount: number;
  currency: string;
}

/**
 * Antes usaba `Math.floor(Math.random() * 900000 + 100000)`: solo 900.000
 * valores posibles y, por la paradoja del cumpleaños, ~50% de probabilidad de
 * colision al llegar a ~1.100 ordenes en el mismo año. Ademas `Math.random()`
 * no es criptograficamente seguro, asi que los numeros de orden eran predecibles.
 *
 * TODO: cuando exista persistencia real, generar esto con una secuencia de base
 * de datos + constraint UNIQUE. La unicidad no puede depender solo del azar.
 */
function buildOrderNumber(now: Date): string {
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  return `FO-${now.getFullYear()}-${suffix}`;
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
      orderNumber: buildOrderNumber(now),
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
