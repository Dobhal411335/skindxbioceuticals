import {
  uploadSingleImage,
  uploadSingleVideo,
  uploadSinglePdf,
  uploadMultipleImages,
  deleteSingleImage,
  deleteMultipleImages,
  UploadOptions,
} from '../../lib/cloudinary';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { MediaType } from '@prisma/client';

async function withMediaUploadLog<T>(
  kind: string,
  userId: string,
  siteCode: string | undefined,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error(
      {
        event: 'media.upload.failure',
        context: 'MEDIA',
        kind,
        userId,
        siteCode,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      },
      'Cloudinary upload failed',
    );
    throw error;
  }
}

export class MediaService {
  static async uploadImage(file: Express.Multer.File, options: UploadOptions, userId: string) {
    const result = await withMediaUploadLog('image', userId, options.siteCode, () =>
      uploadSingleImage(file, options),
    );

    const site = await prisma.site.findUnique({
      where: { code: options.siteCode },
    });

    const media = await prisma.media.create({
      data: {
        siteId: site?.id,
        type: MediaType.IMAGE,
        url: result.url,
        publicId: result.publicId,
        assetId: result.assetId,
        format: result.format,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: result.bytes,
        width: result.width,
        height: result.height,
        feature: options.feature,
        entityId: options.entityId,
        createdById: userId,
      },
    });

    return { media, result };
  }

  static async uploadVideo(file: Express.Multer.File, options: UploadOptions, userId: string) {
    const result = await withMediaUploadLog('video', userId, options.siteCode, () =>
      uploadSingleVideo(file, options),
    );

    const site = await prisma.site.findUnique({
      where: { code: options.siteCode },
    });

    const media = await prisma.media.create({
      data: {
        siteId: site?.id,
        type: MediaType.VIDEO,
        url: result.url,
        publicId: result.publicId,
        assetId: result.assetId,
        format: result.format,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: result.bytes,
        duration: result.duration,
        feature: options.feature,
        entityId: options.entityId,
        createdById: userId,
      },
    });

    return { media, result };
  }

  static async uploadDocument(file: Express.Multer.File, options: UploadOptions, userId: string) {
    const result = await withMediaUploadLog('document', userId, options.siteCode, () =>
      uploadSinglePdf(file, options),
    );

    const site = await prisma.site.findUnique({
      where: { code: options.siteCode },
    });

    const media = await prisma.media.create({
      data: {
        siteId: site?.id,
        type: MediaType.DOCUMENT,
        url: result.url,
        publicId: result.publicId,
        assetId: result.assetId,
        format: result.format,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: result.bytes,
        feature: options.feature,
        entityId: options.entityId,
        createdById: userId,
      },
    });

    return { media, result };
  }

  static async uploadImagesBulk(
    files: Express.Multer.File[],
    options: UploadOptions,
    userId: string,
  ) {
    const bulkResult = await withMediaUploadLog('image_bulk', userId, options.siteCode, () =>
      uploadMultipleImages(files, options),
    );

    const site = await prisma.site.findUnique({
      where: { code: options.siteCode },
    });

    const mediaRecords = [];
    for (const result of bulkResult.successful) {
      const originalFile = files.find((f) => f.size === result.bytes); // Rough match, ideally we'd pass originalname through
      const media = await prisma.media.create({
        data: {
          siteId: site?.id,
          type: MediaType.IMAGE,
          url: result.url,
          publicId: result.publicId,
          assetId: result.assetId,
          format: result.format,
          filename: originalFile?.originalname,
          mimeType: originalFile?.mimetype,
          sizeBytes: result.bytes,
          width: result.width,
          height: result.height,
          feature: options.feature,
          entityId: options.entityId,
          createdById: userId,
        },
      });
      mediaRecords.push(media);
    }

    return { mediaRecords, bulkResult };
  }

  static async deleteMedia(mediaId: string) {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new Error('Media not found');
    }

    if (media.publicId) {
      try {
        await deleteSingleImage(media.publicId);
      } catch (error) {
        logger.error(
          {
            event: 'media.delete.failure',
            context: 'MEDIA',
            mediaId,
            errorName: error instanceof Error ? error.name : 'UnknownError',
          },
          'Cloudinary delete failed',
        );
        throw error;
      }
    }

    await prisma.media.delete({
      where: { id: mediaId },
    });

    return { success: true };
  }

  static async deleteMediaBulk(publicIds: string[]) {
    let result;
    try {
      result = await deleteMultipleImages(publicIds);
    } catch (error) {
      logger.error(
        {
          event: 'media.delete.failure',
          context: 'MEDIA',
          count: publicIds.length,
          errorName: error instanceof Error ? error.name : 'UnknownError',
        },
        'Cloudinary bulk delete failed',
      );
      throw error;
    }

    if (result.deleted.length > 0) {
      await prisma.media.deleteMany({
        where: {
          publicId: {
            in: result.deleted,
          },
        },
      });
    }

    return result;
  }
}
