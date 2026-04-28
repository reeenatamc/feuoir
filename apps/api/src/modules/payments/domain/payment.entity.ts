import { PaymentProvider } from "@feuoir/shared";

export interface PaymentAttempt {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  status: "pending" | "authorized" | "paid" | "failed" | "refunded";
  amount: number;
  currency: string;
  externalReference: string;
  metadata: Record<string, string>;
  createdAt: Date;
}
