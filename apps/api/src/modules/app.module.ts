import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { PaymentsModule } from "./payments/payments.module.js";

@Module({
  imports: [HealthModule, OrdersModule, PaymentsModule]
})
export class AppModule {}
