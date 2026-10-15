import type { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import type { SiteCode } from '@/types/common';

export type AdminOrderLogKind = 'online' | 'cancelled';

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
