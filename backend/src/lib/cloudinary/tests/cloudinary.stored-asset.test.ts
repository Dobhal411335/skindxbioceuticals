import { MediaType } from '@prisma/client';
import {
  deleteStoredCloudinaryAsset,
  mediaTypeToCloudinaryResourceType,
} from '../deletes/delete-stored-asset';
import { deleteSingleImage } from '../deletes/delete-single-image';
import { prisma } from '@/lib/prisma';

jest.mock('../deletes/delete-single-image', () => ({
  deleteSingleImage: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    media: {
      deleteMany: jest.fn(),
    },
  },
}));

describe('deleteStoredCloudinaryAsset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps media types to Cloudinary resource types', () => {
    expect(mediaTypeToCloudinaryResourceType(MediaType.IMAGE)).toBe('image');
    expect(mediaTypeToCloudinaryResourceType(MediaType.VIDEO)).toBe('video');
    expect(mediaTypeToCloudinaryResourceType(MediaType.DOCUMENT)).toBe('raw');
    expect(mediaTypeToCloudinaryResourceType('VIDEO')).toBe('video');
  });

  it('no-ops for empty publicIds', async () => {
    await deleteStoredCloudinaryAsset('');
    await deleteStoredCloudinaryAsset(null);
    expect(deleteSingleImage).not.toHaveBeenCalled();
    expect(prisma.media.deleteMany).not.toHaveBeenCalled();
  });

  it('deletes from Cloudinary then removes Media rows', async () => {
    (deleteSingleImage as jest.Mock).mockResolvedValue({
      publicId: 'gallery/item',
      result: 'ok',
    });
    (prisma.media.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    await deleteStoredCloudinaryAsset('gallery/item', { resourceType: 'video' });

    expect(deleteSingleImage).toHaveBeenCalledWith('gallery/item', {
      resourceType: 'video',
    });
    expect(prisma.media.deleteMany).toHaveBeenCalledWith({
      where: { publicId: 'gallery/item' },
    });
  });

  it('treats Cloudinary not_found as success', async () => {
    (deleteSingleImage as jest.Mock).mockResolvedValue({
      publicId: 'gone',
      result: 'not_found',
    });
    (prisma.media.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

    await expect(deleteStoredCloudinaryAsset('gone')).resolves.toBeUndefined();
    expect(prisma.media.deleteMany).toHaveBeenCalled();
  });
});
