export type CheckoutShippingAddress = {
  firstName?: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
};

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
  cgstTotal?: string;
  sgstTotal?: string;
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
    cgstPercent?: string;
    sgstPercent?: string;
    cgstAmount?: string;
    sgstAmount?: string;
  }>;
  shippingAddress: unknown;
  isGuest: boolean;
};

export type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}
