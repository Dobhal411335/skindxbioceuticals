import type { UserRole } from '@/types/common';
import { ForbiddenError, NotFoundError, ValidationError } from '@/utils/AppError';
import { adminRepository } from './admin.repository';
import type {
  AdminDashboardDto,
  AdminSiteDto,
  ComDashboardDto,
  InDashboardDto,
} from './admin.types';
import type { DashboardQuery } from './admin.validation';

function parseRange(query: DashboardQuery): { from: Date; to: Date } {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from
    ? new Date(query.from)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new ValidationError('Invalid date range');
  }

  if (from > to) {
    throw new ValidationError('"from" must be before or equal to "to"');
  }

  // Inclusive end-of-day when only a date is provided
  if (query.to && /^\d{4}-\d{2}-\d{2}$/.test(query.to)) {
    to.setHours(23, 59, 59, 999);
  }

  return { from, to };
}

/**
 * Admin service - business logic layer.
 */
export class AdminService {
  constructor(private readonly repository = adminRepository) {}

  async listAuthorizedSites(userId: string, role: UserRole): Promise<AdminSiteDto[]> {
    if (role === 'SUPER_ADMIN') {
      const sites = await this.repository.findActiveSites();
      return sites
        .filter((site) => site.code === 'IN' || site.code === 'COM')
        .map((site) => ({
          id: site.id,
          code: site.code as 'IN' | 'COM',
          name: site.name,
          role: 'SUPER_ADMIN' as const,
        }));
    }

    const memberships = await this.repository.findMembershipsForUser(userId);
    return memberships
      .filter((membership) => membership.site.isActive)
      .filter((membership) => membership.site.code === 'IN' || membership.site.code === 'COM')
      .map((membership) => ({
        id: membership.site.id,
        code: membership.site.code as 'IN' | 'COM',
        name: membership.site.name,
        role: membership.role,
      }));
  }

  async getDashboard(input: {
    userId: string;
    role: UserRole;
    siteId: string;
    siteCode: 'IN' | 'COM';
    siteName: string;
    query: DashboardQuery;
  }): Promise<AdminDashboardDto> {
    void input.siteName;

    if (input.role !== 'SUPER_ADMIN') {
      const sites = await this.listAuthorizedSites(input.userId, input.role);
      if (!sites.some((site) => site.id === input.siteId)) {
        throw new ForbiddenError('You do not have access to this site');
      }
    }

    const range = parseRange(input.query);

    if (input.siteCode === 'IN') {
      return this.buildInDashboard(input.siteId, range);
    }

    if (input.siteCode === 'COM') {
      return this.buildComDashboard(input.siteId, range);
    }

    throw new NotFoundError('Unsupported site');
  }

  private async buildInDashboard(
    siteId: string,
    range: { from: Date; to: Date },
  ): Promise<InDashboardDto> {
    const data = await this.repository.getInDashboardAggregates(siteId, range.from, range.to);

    return {
      siteCode: 'IN',
      range: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
      totals: {
        orders: data.orders,
        revenue: data.revenue,
        customers: data.customers,
        productsInStock: data.productsInStock,
        lowStockAlerts: data.lowStockAlerts,
        pendingOrders: data.pendingOrders,
      },
      charts: {
        revenueOverTime: data.revenueOverTime,
        ordersByStatus: data.ordersByStatus,
        bestsellingProducts: data.bestsellingProducts,
        orderActivityOverTime: data.orderActivityOverTime,
      },
      recentOrders: data.recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        grandTotal: Number(order.grandTotal),
        taxTotal: Number(order.taxTotal),
        cgstTotal: Number(order.cgstTotal),
        sgstTotal: Number(order.sgstTotal),
        currency: order.currency,
        createdAt: order.createdAt.toISOString(),
        customerEmail: order.user?.email ?? order.contactEmail,
      })),
    };
  }

  private async buildComDashboard(
    siteId: string,
    range: { from: Date; to: Date },
  ): Promise<ComDashboardDto> {
    const data = await this.repository.getComDashboardAggregates(siteId, range.from, range.to);

    return {
      siteCode: 'COM',
      range: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
      totals: {
        enquiries: data.enquiries,
        newEnquiries: data.newEnquiries,
        awaitingResponse: data.awaitingResponse,
      },
      charts: {
        enquiriesOverTime: data.enquiriesOverTime,
        enquiriesByStatus: data.enquiriesByStatus,
      },
      recentEnquiries: data.recentEnquiries.map((enquiry) => ({
        id: enquiry.id,
        name: enquiry.name,
        email: enquiry.email,
        subject: enquiry.subject,
        status: enquiry.status,
        createdAt: enquiry.createdAt.toISOString(),
      })),
    };
  }
}

export const adminService = new AdminService();
