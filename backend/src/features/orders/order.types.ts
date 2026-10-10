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
  quantity: number;
  lineTotal: string;
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
  grandTotal: string;
  paymentStatus: string | null;
  placedAt: string | null;
  createdAt: string;
  items: OrderItemDto[];
}

export interface PaginatedOrdersDto {
  orders: OrderListItemDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
