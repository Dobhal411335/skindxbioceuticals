export type CustomerOrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  grandTotal: string;
  itemCount: number;
  paymentStatus: string | null;
  placedAt: string | null;
  createdAt: string;
};

export type CustomerOrderItem = {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  unitPrice: string;
  originalUnitPrice: string | null;
  quantity: number;
  lineTotal: string;
};

export type CustomerOrderDetail = {
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
  items: CustomerOrderItem[];
};

export type PaginatedOrders = {
  orders: CustomerOrderListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
