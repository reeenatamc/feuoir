import { Injectable } from "@nestjs/common";
import { Order } from "../domain/order.entity.js";
import { OrderRepository } from "../domain/order.repository.js";

@Injectable()
export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders: Order[] = [];

  async save(order: Order): Promise<Order> {
    this.orders.push(order);
    return order;
  }
}
