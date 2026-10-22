export interface OrderListItemDto {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  grandTotal: string;
  itemCount: number;
  paymentStatus: string | null;
  placedAt: string | null;
  createdAt: string;
}

export interface OrderItemDto {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  unitPrice: string;
  originalUnitPrice: string | null;
  quantity: number;
  lineTotal: string;
  cgstPercent: string;
  sgstPercent: string;
  cgstAmount: string;
  sgstAmount: string;
}

export interface OrderDetailDto {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  cgstTotal: string;
  sgstTotal: string;
  grandTotal: string;
  paymentStatus: string | null;
  placedAt: string | null;
  createdAt: string;
  statusMessage?: string | null;
  customerNotes?: string | null;
  prescriptionImageUrl?: string | null;
  statusHistory?: Array<{
    status: string;
    message: string | null;
    updatedAt: string;
  }>;
  items: OrderItemDto[];
}

export interface PaginatedOrdersDto {
  orders: OrderListItemDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
