export type CreatePaymentOrderResult = {
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  amountInPaise: number;
  currency: string;
  keyId: string;
  paymentId: string;
  status: string;
  confirmationToken?: string;
};

export type VerifyPaymentResult = {
  orderId: string;
  orderNumber: string;
  paymentStatus: string;
  orderStatus: string;
  alreadyProcessed: boolean;
  confirmationToken?: string;
};

export type PaymentStatusResult = {
  orderId: string;
  orderNumber: string;
  paymentStatus: string | null;
  orderStatus: string;
  grandTotal: string;
  currency: string;
  paidAt: string | null;
};

export type OrderConfirmationResult = {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string | null;
  currency: string;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  grandTotal: string;
  contactEmail: string;
  placedAt: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    variantName: string;
    sku: string;
    unitPrice: string;
    originalUnitPrice: string | null;
    quantity: number;
    lineTotal: string;
  }>;
  shippingAddress: unknown;
  isGuest: boolean;
};
