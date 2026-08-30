import type { PaymentProvider, PaymentStatus } from "@feuoir/shared";

export interface PaymentAttempt {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  currency: string;
  externalReference: string;
  metadata: Record<string, string>;
  createdAt: Date;
}
