import {
  deleteStoredCloudinaryAsset,
  deleteStoredCloudinaryAssetBestEffort,
} from '@/lib/cloudinary';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { NotFoundError } from '@/utils/AppError';
import { socialPostsRepository } from './social-posts.repository';
import type { SocialPostBody, SocialPostPatchBody } from './social-posts.validation';
import type {
  SocialPostDto,
  SocialPostRecord,
  SocialPostTypeDto,
  SocialPostWrite,
  SiteCodeDto,
} from './social-posts.types';
import { toDtoPostType, toPrismaPostType } from './social-posts.types';

export function toSocialPostDto(record: SocialPostRecord, siteCode: SiteCodeDto): SocialPostDto {
  return {
    id: record.id,
    siteCode,
    postType: toDtoPostType(record.postType),
    imageUrl: record.imageUrl,
    imagePublicId: record.imagePublicId,
    postUrl: record.postUrl,
    active: record.active,
    order: record.order,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function bodyToWrite(body: SocialPostBody, fallbackOrder: number): SocialPostWrite {
  return {
    postType: toPrismaPostType(body.postType),
    imageUrl: body.imageUrl,
    imagePublicId: body.imagePublicId ?? '',
    postUrl: body.postUrl,
    active: body.active,
    order: body.order ?? fallbackOrder,
  };
}

export class SocialPostsService {
  constructor(private readonly repository = socialPostsRepository) {}

  async listForSite(
    siteId: string,
    siteCode: SiteCode,
    postType?: SocialPostTypeDto,
  ): Promise<SocialPostDto[]> {
    const rows = await this.repository.listBySiteId(
      siteId,
      postType ? toPrismaPostType(postType) : undefined,
    );
    return rows.map((row) => toSocialPostDto(row, siteCode));
  }

  async listActiveForSite(siteId: string, siteCode: SiteCode): Promise<SocialPostDto[]> {
    const rows = await this.repository.listActiveBySiteId(siteId);
    return rows.map((row) => toSocialPostDto(row, siteCode));
  }

  async createForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: SocialPostBody;
  }): Promise<SocialPostDto> {
    const prismaType = toPrismaPostType(input.body.postType);
    const nextOrder = await this.repository.nextOrder(input.siteId, prismaType);
    const data = bodyToWrite(input.body, nextOrder);
    const record = await this.repository.create(input.siteId, data);

    logger.info(
      {
        event: 'social_post.created',
        siteCode: input.siteCode,
        userId: input.userId,
        socialPostId: record.id,
        postType: input.body.postType,
      },
      'Social post created',
    );

    return toSocialPostDto(record, input.siteCode);
  }

  async updateForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    postId: string;
    body: SocialPostBody;
  }): Promise<SocialPostDto> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.postId);
    if (!existing) {
      throw new NotFoundError('Social post not found');
    }

    const data = bodyToWrite(input.body, existing.order);
    const record = await this.repository.update(input.siteId, input.postId, data);
    if (!record) {
      throw new NotFoundError('Social post not found');
    }

    const previousPublicId = existing.imagePublicId.trim();
    const nextPublicId = data.imagePublicId.trim();
    if (previousPublicId && previousPublicId !== nextPublicId) {
      await deleteStoredCloudinaryAssetBestEffort(previousPublicId);
    }

    logger.info(
      {
        event: 'social_post.updated',
        siteCode: input.siteCode,
        userId: input.userId,
        socialPostId: record.id,
        postType: input.body.postType,
      },
      'Social post updated',
    );

    return toSocialPostDto(record, input.siteCode);
  }

  async patchForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    postId: string;
    body: SocialPostPatchBody;
  }): Promise<SocialPostDto> {
    const record = await this.repository.patch(input.siteId, input.postId, input.body);
    if (!record) {
      throw new NotFoundError('Social post not found');
    }

    logger.info(
      {
        event: 'social_post.patched',
        siteCode: input.siteCode,
        userId: input.userId,
        socialPostId: record.id,
        active: record.active,
        order: record.order,
      },
      'Social post patched',
    );

    return toSocialPostDto(record, input.siteCode);
  }

  async deleteForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    postId: string;
  }): Promise<void> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.postId);
    if (!existing) {
      throw new NotFoundError('Social post not found');
    }

    if (existing.imagePublicId.trim()) {
      await deleteStoredCloudinaryAsset(existing.imagePublicId);
    }

    const deleted = await this.repository.delete(input.siteId, input.postId);
    if (!deleted) {
      throw new NotFoundError('Social post not found');
    }

    logger.info(
      {
        event: 'social_post.deleted',
        siteCode: input.siteCode,
        userId: input.userId,
        socialPostId: input.postId,
      },
      'Social post deleted',
    );
  }
}

export const socialPostsService = new SocialPostsService();
