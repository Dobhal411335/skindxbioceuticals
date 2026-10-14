import type { SiteCode } from "@/types/auth";

export interface DatePoint {
  date: string;
  value: number;
}

export interface NamedCount {
  name: string;
  count: number;
}

export interface InDashboard {
  siteCode: "IN";
  range: { from: string; to: string };
  totals: {
    orders: number;
    revenue: number;
    customers: number;
    productsInStock: number;
    lowStockAlerts: number;
    pendingOrders: number;
  };
  charts: {
    revenueOverTime: DatePoint[];
    ordersByStatus: NamedCount[];
    bestsellingProducts: NamedCount[];
    orderActivityOverTime: DatePoint[];
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    grandTotal: number;
    taxTotal?: number;
    cgstTotal?: number;
    sgstTotal?: number;
    currency: string;
    createdAt: string;
    customerEmail: string | null;
  }>;
}

export interface ComDashboard {
  siteCode: "COM";
  range: { from: string; to: string };
  totals: {
    enquiries: number;
    newEnquiries: number;
    awaitingResponse: number;
  };
  charts: {
    enquiriesOverTime: DatePoint[];
    enquiriesByStatus: NamedCount[];
  };
  recentEnquiries: Array<{
    id: string;
    name: string;
    email: string;
    subject: string | null;
    status: string;
    createdAt: string;
  }>;
}

export type DashboardData = InDashboard | ComDashboard;

export function isInDashboard(data: DashboardData): data is InDashboard {
  return data.siteCode === "IN";
}

export function isComDashboard(data: DashboardData): data is ComDashboard {
  return data.siteCode === "COM";
}

export type DashboardSiteCode = Extract<SiteCode, "IN" | "COM">;
