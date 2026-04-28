import { Module } from "@nestjs/common";
import { OrdersController } from "./presentation/orders.controller.js";
import { CreateOrderUseCase } from "./application/create-order.use-case.js";
import { InMemoryOrderRepository } from "./infrastructure/in-memory-order.repository.js";
import { ORDER_REPOSITORY } from "./domain/order.repository.js";

@Module({
  controllers: [OrdersController],
  providers: [
    CreateOrderUseCase,
    { provide: ORDER_REPOSITORY, useClass: InMemoryOrderRepository }
  ]
})
export class OrdersModule {}
