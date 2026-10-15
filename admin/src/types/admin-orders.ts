export type AdminOrderLogKind = "online" | "cancelled";
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
