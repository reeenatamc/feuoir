import type { PaymentStatus } from "@feuoir/shared";

export type OrderStatus = "pending_whatsapp" | "confirmed" | "cancelled";

// `PaymentStatus` vive en @feuoir/shared. Estaba redefinido aqui y tambien en
// payments/domain/payment.entity.ts: tres copias del mismo union que podian
// divergir sin que el compilador avisara.
export type { PaymentStatus };

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  subtotalAmount: number;
  totalAmount: number;
  createdAt: Date;
}
