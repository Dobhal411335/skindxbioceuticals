export type AdminOrderLogKind = "online" | "cancelled" | "vendor";
export type AdminOrderLogPeriod = "today" | "all" | "day";

export interface AdminOrderLogItem {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  grandTotal: number;
  taxTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  customerEmail: string | null;
  paymentStatus: string | null;
  paymentMethod: string | null;
  itemCount: number;
  placedAt: string | null;
  createdAt: string;
  cancelledAt: string | null;
}

export interface AdminOrderLogPage {
  siteCode: "IN" | "COM";
  kind: AdminOrderLogKind;
  filter: {
    mode: "day" | "all";
    date: string | null;
  };
  orders: AdminOrderLogItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface AdminOrderLogQuery {
  page?: number;
  pageSize?: number;
  date?: string;
  all?: boolean;
  q?: string;
}

export interface AdminOrderDetailItem {
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

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
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
  shippingAddress: any;
  billingAddress: any;
  placedAt: string | null;
  createdAt: string;
  updatedAt: string;
  paymentStatus: string | null;
  paymentMethod: string | null;
  paymentDetails: Array<{
    id: string;
    status: string;
    method: string;
    amount: number;
    currency: string;
    provider: string;
    providerOrderId: string | null;
    paidAt: string | null;
    createdAt: string;
  }>;
  items: AdminOrderDetailItem[];
  statusMessage: string | null;
  customerNotes: string | null;
  prescriptionImageUrl?: string | null;
  statusHistory: Array<{
    status: string;
    message: string | null;
    updatedAt: string;
  }>;
}

export interface AdminOrderEnquiryItem extends AdminOrderDetail {
  itemCount: number;
  itemsSummary: string;
}

export interface AdminOrderEnquiryPage {
  siteCode: "IN" | "COM";
  filter: {
    mode: "day" | "all";
    date: string | null;
    status?: string;
  };
  orders: AdminOrderEnquiryItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface AdminOrderEnquiryQuery {
  page?: number;
  pageSize?: number;
  date?: string;
  all?: boolean;
  status?: string;
  q?: string;
}

export interface AdminOrderUpdateStatusPayload {
  status: string;
  message?: string | null;
}
