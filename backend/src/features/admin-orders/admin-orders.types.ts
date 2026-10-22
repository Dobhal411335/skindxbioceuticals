import type { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import type { SiteCode } from '@/types/common';

export type AdminOrderLogKind = 'online' | 'cancelled' | 'vendor';

export interface AdminOrderLogItemDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  currency: string;
  grandTotal: number;
  taxTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  customerEmail: string | null;
  paymentStatus: PaymentStatus | null;
  paymentMethod: PaymentMethod | null;
  itemCount: number;
  placedAt: string | null;
  createdAt: string;
  cancelledAt: string | null;
}

export interface AdminOrderLogPageDto {
  siteCode: SiteCode;
  kind: AdminOrderLogKind;
  filter: {
    mode: 'day' | 'all';
    date: string | null;
  };
  orders: AdminOrderLogItemDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface AdminOrderDetailItemDto {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  unitPrice: number;
  originalUnitPrice: number | null;
  quantity: number;
  lineTotal: number;
  cgstPercent: number;
  sgstPercent: number;
  cgstAmount: number;
  sgstAmount: number;
  image: string | null;
}

export interface AdminOrderDetailDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  grandTotal: number;
  customerName: string | null;
  customerEmail: string;
  customerPhone: string | null;
  userId: string | null;
  shippingAddress: unknown;
  billingAddress: unknown;
  placedAt: string | null;
  createdAt: string;
  updatedAt: string;
  paymentStatus: PaymentStatus | null;
  paymentMethod: PaymentMethod | null;
  paymentDetails: Array<{
    id: string;
    status: PaymentStatus;
    method: PaymentMethod;
    amount: number;
    currency: string;
    provider: string;
    providerOrderId: string | null;
    paidAt: string | null;
    createdAt: string;
  }>;
  items: AdminOrderDetailItemDto[];
  statusMessage: string | null;
  customerNotes: string | null;
  prescriptionImageUrl: string | null;
  statusHistory: Array<{
    status: string;
    message: string | null;
    updatedAt: string;
  }>;
}

export interface AdminOrderEnquiryItemDto extends AdminOrderDetailDto {
  itemCount: number;
  itemsSummary: string;
}

export interface AdminOrderEnquiryPageDto {
  siteCode: SiteCode;
  filter: {
    mode: 'day' | 'all';
    date: string | null;
    status?: string;
  };
  orders: AdminOrderEnquiryItemDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}
