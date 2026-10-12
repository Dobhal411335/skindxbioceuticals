import {
  deleteStoredCloudinaryAsset,
  deleteStoredCloudinaryAssetBestEffort,
} from '@/lib/cloudinary';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { NotFoundError } from '@/utils/AppError';
import { customerReviewsRepository } from './customer-reviews.repository';
import type {
  CustomerReviewBody,
  CustomerReviewPatchBody,
} from './customer-reviews.validation';
import type {
  CustomerReviewDto,
  CustomerReviewRecord,
  CustomerReviewWrite,
  SiteCodeDto,
} from './customer-reviews.types';

function preferHttpsUrl(url: string): string {
  if (url.startsWith('http://res.cloudinary.com/')) {
    return `https://${url.slice('http://'.length)}`;
  }
  return url;
}

export function toCustomerReviewDto(
  record: CustomerReviewRecord,
  siteCode: SiteCodeDto,
): CustomerReviewDto {
  return {
    id: record.id,
    siteCode,
    customerName: record.customerName,
    designation: record.designation,
    description: record.description,
    rating: record.rating,
    imageUrl: preferHttpsUrl(record.imageUrl),
    imagePublicId: record.imagePublicId,
    active: record.active,
    order: record.order,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function bodyToWrite(body: CustomerReviewBody, fallbackOrder: number): CustomerReviewWrite {
  return {
    customerName: body.customerName,
    designation: body.designation,
    description: body.description,
    rating: body.rating,
    imageUrl: preferHttpsUrl(body.imageUrl),
    imagePublicId: body.imagePublicId ?? '',
    active: body.active,
    order: body.order ?? fallbackOrder,
  };
}

export class CustomerReviewsService {
  constructor(private readonly repository = customerReviewsRepository) {}

  async listForSite(siteId: string, siteCode: SiteCode): Promise<CustomerReviewDto[]> {
    const rows = await this.repository.listBySiteId(siteId);
    return rows.map((row) => toCustomerReviewDto(row, siteCode));
  }

  async listActiveForSite(siteId: string, siteCode: SiteCode): Promise<CustomerReviewDto[]> {
    const rows = await this.repository.listActiveBySiteId(siteId);
    return rows.map((row) => toCustomerReviewDto(row, siteCode));
  }

  async createForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: CustomerReviewBody;
  }): Promise<CustomerReviewDto> {
    const nextOrder = await this.repository.nextOrder(input.siteId);
    const data = bodyToWrite(input.body, nextOrder);
    const record = await this.repository.create(input.siteId, data);

    logger.info(
      {
        event: 'customer_review.created',
        siteCode: input.siteCode,
        userId: input.userId,
        customerReviewId: record.id,
        rating: record.rating,
      },
      'Customer review created',
    );

    return toCustomerReviewDto(record, input.siteCode);
  }

  async updateForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    reviewId: string;
    body: CustomerReviewBody;
  }): Promise<CustomerReviewDto> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.reviewId);
    if (!existing) {
      throw new NotFoundError('Customer review not found');
    }

    const data = bodyToWrite(input.body, existing.order);
    const record = await this.repository.update(input.siteId, input.reviewId, data);
    if (!record) {
      throw new NotFoundError('Customer review not found');
    }

    const previousPublicId = existing.imagePublicId.trim();
    const nextPublicId = data.imagePublicId.trim();
    if (previousPublicId && previousPublicId !== nextPublicId) {
      await deleteStoredCloudinaryAssetBestEffort(previousPublicId);
    }

    logger.info(
      {
        event: 'customer_review.updated',
        siteCode: input.siteCode,
        userId: input.userId,
        customerReviewId: record.id,
        rating: record.rating,
      },
      'Customer review updated',
    );

    return toCustomerReviewDto(record, input.siteCode);
  }

  async patchForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    reviewId: string;
    body: CustomerReviewPatchBody;
  }): Promise<CustomerReviewDto> {
    const record = await this.repository.patch(input.siteId, input.reviewId, input.body);
    if (!record) {
      throw new NotFoundError('Customer review not found');
    }

    logger.info(
      {
        event: 'customer_review.patched',
        siteCode: input.siteCode,
        userId: input.userId,
        customerReviewId: record.id,
        active: record.active,
        order: record.order,
      },
      'Customer review patched',
    );

    return toCustomerReviewDto(record, input.siteCode);
  }

  async deleteForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    reviewId: string;
  }): Promise<void> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.reviewId);
    if (!existing) {
      throw new NotFoundError('Customer review not found');
    }

    if (existing.imagePublicId.trim()) {
      await deleteStoredCloudinaryAsset(existing.imagePublicId);
    }

    const deleted = await this.repository.delete(input.siteId, input.reviewId);
    if (!deleted) {
      throw new NotFoundError('Customer review not found');
    }

    logger.info(
      {
        event: 'customer_review.deleted',
        siteCode: input.siteCode,
        userId: input.userId,
        customerReviewId: input.reviewId,
      },
      'Customer review deleted',
    );
  }
}

export const customerReviewsService = new CustomerReviewsService();
