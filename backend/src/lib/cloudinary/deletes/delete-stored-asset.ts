import { MediaType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { CloudinaryError } from '../cloudinary.errors';
import type { ResourceType } from '../cloudinary.types';
import { deleteSingleImage, type DeleteAssetOptions } from './delete-single-image';

export function mediaTypeToCloudinaryResourceType(
  mediaType: MediaType | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | string,
): Exclude<ResourceType, 'auto'> {
  switch (mediaType) {
    case MediaType.VIDEO:
    case 'VIDEO':
    case 'video':
      return 'video';
    case MediaType.DOCUMENT:
    case 'DOCUMENT':
    case 'raw':
      return 'raw';
    default:
      return 'image';
  }
}

/**
 * Deletes a Cloudinary asset by publicId and removes any matching Media row.
 * `not_found` from Cloudinary is treated as success (already gone).
 */
export async function deleteStoredCloudinaryAsset(
  publicId: string | null | undefined,
  options: DeleteAssetOptions = {},
): Promise<void> {
  const trimmed = typeof publicId === 'string' ? publicId.trim() : '';
  if (!trimmed) {
    return;
  }

  try {
    const result = await deleteSingleImage(trimmed, options);
    if (result.result !== 'ok' && result.result !== 'not_found') {
      throw new CloudinaryError(
        `Cloudinary delete returned unexpected status: ${result.result}`,
      );
    }
  } catch (error) {
    logger.error(
      {
        event: 'cloudinary.asset.delete.failure',
        context: 'CLOUDINARY',
        publicId: trimmed,
        resourceType: options.resourceType ?? 'image',
        errorName: error instanceof Error ? error.name : 'UnknownError',
      },
      'Cloudinary asset delete failed',
    );
    throw error;
  }

  try {
    await prisma.media.deleteMany({
      where: { publicId: trimmed },
    });
  } catch (error) {
    logger.error(
      {
        event: 'media.row.delete.failure',
        context: 'MEDIA',
        publicId: trimmed,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      },
      'Media row cleanup after Cloudinary delete failed',
    );
    throw error;
  }
}

/**
 * Best-effort cleanup when replacing/clearing an asset. Logs failures; does not throw.
 */
export async function deleteStoredCloudinaryAssetBestEffort(
  publicId: string | null | undefined,
  options: DeleteAssetOptions = {},
): Promise<void> {
  try {
    await deleteStoredCloudinaryAsset(publicId, options);
  } catch {
    // Logged in deleteStoredCloudinaryAsset; callers already persisted the new refs.
  }
}
