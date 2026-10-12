import { prisma } from '@/lib/prisma';
import type { CustomerReviewRecord, CustomerReviewWrite } from './customer-reviews.types';

function mapReview(row: {
  id: string;
  siteId: string;
  customerName: string;
  designation: string;
  description: string;
  rating: number;
  imageUrl: string;
  imagePublicId: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}): CustomerReviewRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    customerName: row.customerName,
    designation: row.designation,
    description: row.description,
    rating: row.rating,
    imageUrl: row.imageUrl,
    imagePublicId: row.imagePublicId,
    active: row.active,
    order: row.order,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class CustomerReviewsRepository {
  async listBySiteId(siteId: string): Promise<CustomerReviewRecord[]> {
    const rows = await prisma.customerReview.findMany({
      where: { siteId },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapReview);
  }

  async listActiveBySiteId(siteId: string): Promise<CustomerReviewRecord[]> {
    const rows = await prisma.customerReview.findMany({
      where: { siteId, active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapReview);
  }

  async findByIdForSite(siteId: string, reviewId: string): Promise<CustomerReviewRecord | null> {
    const row = await prisma.customerReview.findFirst({
      where: { id: reviewId, siteId },
    });
    return row ? mapReview(row) : null;
  }

  async nextOrder(siteId: string): Promise<number> {
    const last = await prisma.customerReview.findFirst({
      where: { siteId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return (last?.order ?? 0) + 1;
  }

  async create(siteId: string, data: CustomerReviewWrite): Promise<CustomerReviewRecord> {
    const row = await prisma.customerReview.create({
      data: {
        siteId,
        customerName: data.customerName,
        designation: data.designation,
        description: data.description,
        rating: data.rating,
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId,
        active: data.active,
        order: data.order,
      },
    });
    return mapReview(row);
  }

  async update(
    siteId: string,
    reviewId: string,
    data: CustomerReviewWrite,
  ): Promise<CustomerReviewRecord | null> {
    const existing = await prisma.customerReview.findFirst({
      where: { id: reviewId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const row = await prisma.customerReview.update({
      where: { id: reviewId },
      data: {
        customerName: data.customerName,
        designation: data.designation,
        description: data.description,
        rating: data.rating,
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId,
        active: data.active,
        order: data.order,
      },
    });
    return mapReview(row);
  }

  async patch(
    siteId: string,
    reviewId: string,
    data: { active?: boolean; order?: number },
  ): Promise<CustomerReviewRecord | null> {
    const existing = await prisma.customerReview.findFirst({
      where: { id: reviewId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const row = await prisma.customerReview.update({
      where: { id: reviewId },
      data: {
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
      },
    });
    return mapReview(row);
  }

  async delete(siteId: string, reviewId: string): Promise<boolean> {
    const existing = await prisma.customerReview.findFirst({
      where: { id: reviewId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return false;
    }
    await prisma.customerReview.delete({ where: { id: reviewId } });
    return true;
  }
}

export const customerReviewsRepository = new CustomerReviewsRepository();
