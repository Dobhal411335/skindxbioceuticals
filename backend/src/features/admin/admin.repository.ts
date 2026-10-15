import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { SiteCode } from '@/types/common';

/**
 * Admin repository - Prisma data access only.
 */
export class AdminRepository {
  protected readonly db = prisma;

  async findActiveSites() {
    return this.db.site.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async findMembershipsForUser(userId: string) {
    return this.db.siteMembership.findMany({
      where: { userId },
      include: { site: true },
    });
  }

  async getInDashboardAggregates(siteId: string, from: Date, to: Date) {
    const orderWhere: Prisma.OrderWhereInput = {
      siteId,
      createdAt: { gte: from, lte: to },
    };

    /** Revenue counts only non-cancelled/refunded orders with a completed (CAPTURED) payment. */
    const completedPaymentOrderWhere: Prisma.OrderWhereInput = {
      ...orderWhere,
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
      payments: { some: { status: 'CAPTURED' } },
    };

    const [
      orders,
      revenueAgg,
      customerGroups,
      pendingOrders,
      ordersByStatus,
      recentOrders,
      productsInStock,
      lowStockAlerts,
      revenueRows,
      activityRows,
      bestsellerRows,
    ] = await Promise.all([
      this.db.order.count({ where: orderWhere }),
      this.db.order.aggregate({
        where: completedPaymentOrderWhere,
        _sum: { grandTotal: true },
      }),
      this.db.order.groupBy({
        by: ['userId'],
        where: orderWhere,
      }),
      this.db.order.count({
        where: {
          siteId,
          status: 'PENDING',
          createdAt: { gte: from, lte: to },
        },
      }),
      this.db.order.groupBy({
        by: ['status'],
        where: orderWhere,
        _count: { _all: true },
      }),
      this.db.order.findMany({
        where: { siteId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { email: true } },
        },
      }),
      this.db.inventoryItem.count({
        where: {
          quantityOnHand: { gt: 0 },
          variant: { product: { siteId } },
        },
      }),
      this.db.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM inventory_items ii
        INNER JOIN product_variants pv ON pv.id = ii.variant_id
        INNER JOIN products p ON p.id = pv.product_id
        WHERE p.site_id = ${siteId}::uuid
          AND ii.quantity_on_hand <= ii.low_stock_threshold
      `,
      this.db.$queryRaw<Array<{ date: Date; value: Prisma.Decimal }>>`
        SELECT date_trunc('day', o.created_at) AS date,
               COALESCE(SUM(o.grand_total), 0) AS value
        FROM orders o
        WHERE o.site_id = ${siteId}::uuid
          AND o.created_at >= ${from}
          AND o.created_at <= ${to}
          AND o.status NOT IN ('CANCELLED', 'REFUNDED')
          AND EXISTS (
            SELECT 1
            FROM payments p
            WHERE p.order_id = o.id
              AND p.status = 'CAPTURED'
          )
        GROUP BY 1
        ORDER BY 1 ASC
      `,
      this.db.$queryRaw<Array<{ date: Date; value: bigint }>>`
        SELECT date_trunc('day', o.created_at) AS date,
               COUNT(*)::bigint AS value
        FROM orders o
        WHERE o.site_id = ${siteId}::uuid
          AND o.created_at >= ${from}
          AND o.created_at <= ${to}
        GROUP BY 1
        ORDER BY 1 ASC
      `,
      this.db.$queryRaw<Array<{ name: string; count: bigint }>>`
        SELECT oi.product_name AS name,
               SUM(oi.quantity)::bigint AS count
        FROM order_items oi
        INNER JOIN orders o ON o.id = oi.order_id
        WHERE o.site_id = ${siteId}::uuid
          AND o.created_at >= ${from}
          AND o.created_at <= ${to}
          AND o.status NOT IN ('CANCELLED', 'REFUNDED')
          AND EXISTS (
            SELECT 1
            FROM payments p
            WHERE p.order_id = o.id
              AND p.status = 'CAPTURED'
          )
        GROUP BY oi.product_name
        ORDER BY count DESC
        LIMIT 8
      `,
    ]);

    return {
      orders,
      revenue: Number(revenueAgg._sum.grandTotal ?? 0),
      customers: customerGroups.length,
      pendingOrders,
      productsInStock,
      lowStockAlerts: Number(lowStockAlerts[0]?.count ?? 0),
      ordersByStatus: ordersByStatus.map((row) => ({
        name: row.status,
        count: row._count._all,
      })),
      recentOrders,
      revenueOverTime: revenueRows.map((row) => ({
        date: row.date.toISOString().slice(0, 10),
        value: Number(row.value),
      })),
      orderActivityOverTime: activityRows.map((row) => ({
        date: row.date.toISOString().slice(0, 10),
        value: Number(row.value),
      })),
      bestsellingProducts: bestsellerRows.map((row) => ({
        name: row.name,
        count: Number(row.count),
      })),
    };
  }

  async getComDashboardAggregates(siteId: string, from: Date, to: Date) {
    const enquiryWhere: Prisma.EnquiryWhereInput = {
      siteId,
      createdAt: { gte: from, lte: to },
    };

    const [enquiries, newEnquiries, awaitingResponse, byStatus, recentEnquiries, overTime] =
      await Promise.all([
        this.db.enquiry.count({ where: enquiryWhere }),
        this.db.enquiry.count({
          where: { ...enquiryWhere, status: 'NEW' },
        }),
        this.db.enquiry.count({
          where: {
            siteId,
            status: { in: ['NEW', 'IN_PROGRESS'] },
            createdAt: { gte: from, lte: to },
          },
        }),
        this.db.enquiry.groupBy({
          by: ['status'],
          where: enquiryWhere,
          _count: { _all: true },
        }),
        this.db.enquiry.findMany({
          where: { siteId },
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
        this.db.$queryRaw<Array<{ date: Date; value: bigint }>>`
          SELECT date_trunc('day', e.created_at) AS date,
                 COUNT(*)::bigint AS value
          FROM enquiries e
          WHERE e.site_id = ${siteId}::uuid
            AND e.created_at >= ${from}
            AND e.created_at <= ${to}
          GROUP BY 1
          ORDER BY 1 ASC
        `,
      ]);

    return {
      enquiries,
      newEnquiries,
      awaitingResponse,
      enquiriesByStatus: byStatus.map((row) => ({
        name: row.status,
        count: row._count._all,
      })),
      recentEnquiries,
      enquiriesOverTime: overTime.map((row) => ({
        date: row.date.toISOString().slice(0, 10),
        value: Number(row.value),
      })),
    };
  }

  async resolveSiteCode(siteId: string): Promise<SiteCode | null> {
    const site = await this.db.site.findUnique({ where: { id: siteId } });
    if (!site) return null;
    if (site.code !== 'IN' && site.code !== 'COM') return null;
    return site.code;
  }
}

export const adminRepository = new AdminRepository();
