export type OrderStatus = "pending_whatsapp" | "confirmed" | "cancelled";
export type PaymentStatus = "pending" | "authorized" | "paid" | "failed" | "refunded";

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
