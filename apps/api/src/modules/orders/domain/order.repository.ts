import { Order } from "./order.entity.js";

export const ORDER_REPOSITORY = Symbol("ORDER_REPOSITORY");

export interface OrderRepository {
  save(order: Order): Promise<Order>;
}
