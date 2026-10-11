import type { SocialPostType as PrismaSocialPostType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { SocialPostRecord, SocialPostWrite } from './social-posts.types';

function mapPost(row: {
  id: string;
  siteId: string;
  postType: PrismaSocialPostType;
  imageUrl: string;
  imagePublicId: string;
  postUrl: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}): SocialPostRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    postType: row.postType,
    imageUrl: row.imageUrl,
    imagePublicId: row.imagePublicId,
    postUrl: row.postUrl,
    active: row.active,
    order: row.order,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class SocialPostsRepository {
  async listBySiteId(siteId: string, postType?: PrismaSocialPostType): Promise<SocialPostRecord[]> {
    const rows = await prisma.socialPost.findMany({
      where: {
        siteId,
        ...(postType !== undefined ? { postType } : {}),
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapPost);
  }

  async listActiveBySiteId(siteId: string): Promise<SocialPostRecord[]> {
    const rows = await prisma.socialPost.findMany({
      where: { siteId, active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapPost);
  }

  async findByIdForSite(siteId: string, postId: string): Promise<SocialPostRecord | null> {
    const row = await prisma.socialPost.findFirst({
      where: {
        id: postId,
        siteId: siteId,
      },
    });
    return row ? mapPost(row) : null;
  }

  async nextOrder(siteId: string, postType: PrismaSocialPostType): Promise<number> {
    const last = await prisma.socialPost.findFirst({
      where: { siteId, postType },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return (last?.order ?? 0) + 1;
  }

  async create(siteId: string, data: SocialPostWrite): Promise<SocialPostRecord> {
    const row = await prisma.socialPost.create({
      data: {
        siteId,
        postType: data.postType,
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId,
        postUrl: data.postUrl,
        active: data.active,
        order: data.order,
      },
    });
    return mapPost(row);
  }

  async update(
    siteId: string,
    postId: string,
    data: SocialPostWrite,
  ): Promise<SocialPostRecord | null> {
    const existing = await prisma.socialPost.findFirst({
      where: { id: postId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const row = await prisma.socialPost.update({
      where: { id: postId },
      data: {
        postType: data.postType,
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId,
        postUrl: data.postUrl,
        active: data.active,
        order: data.order,
      },
    });
    return mapPost(row);
  }

  async patch(
    siteId: string,
    postId: string,
    data: { active?: boolean; order?: number },
  ): Promise<SocialPostRecord | null> {
    const existing = await prisma.socialPost.findFirst({
      where: { id: postId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const row = await prisma.socialPost.update({
      where: { id: postId },
      data: {
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
      },
    });
    return mapPost(row);
  }

  async delete(siteId: string, postId: string): Promise<boolean> {
    const existing = await prisma.socialPost.findFirst({
      where: { id: postId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return false;
    }
    await prisma.socialPost.delete({ where: { id: postId } });
    return true;
  }
}

export const socialPostsRepository = new SocialPostsRepository();
