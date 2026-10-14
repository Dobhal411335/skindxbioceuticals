import type { SiteCode, SiteRole } from '@/types/common';

export interface AdminSiteDto {
  id: string;
  code: SiteCode;
  name: string;
  role: SiteRole | 'SUPER_ADMIN';
}

export interface DatePointDto {
  date: string;
  value: number;
}

export interface NamedCountDto {
  name: string;
  count: number;
}

export interface RecentOrderDto {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number;
  taxTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  currency: string;
  createdAt: string;
  customerEmail: string | null;
}

export interface RecentEnquiryDto {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  status: string;
  createdAt: string;
}

export interface InDashboardDto {
  siteCode: 'IN';
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
    revenueOverTime: DatePointDto[];
    ordersByStatus: NamedCountDto[];
    bestsellingProducts: NamedCountDto[];
    orderActivityOverTime: DatePointDto[];
  };
  recentOrders: RecentOrderDto[];
}

export interface ComDashboardDto {
  siteCode: 'COM';
  range: { from: string; to: string };
  totals: {
    enquiries: number;
    newEnquiries: number;
    awaitingResponse: number;
  };
  charts: {
    enquiriesOverTime: DatePointDto[];
    enquiriesByStatus: NamedCountDto[];
  };
  recentEnquiries: RecentEnquiryDto[];
}

export type AdminDashboardDto = InDashboardDto | ComDashboardDto;
