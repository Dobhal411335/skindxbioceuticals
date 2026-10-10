import { Request, Response } from 'express';
import { MediaService } from './media.service';
import { validateBulkDelete, validateUploadQuery } from './media.validation';
import { CloudinaryError } from '../../lib/cloudinary';
import { sendCreated, sendSuccess, sendError } from '../../utils/apiResponse';

export class MediaController {
  static async uploadImage(req: Request, res: Response) {
    try {
      const options = validateUploadQuery(req.query);
      const file = req.file;

      if (!file) {
        return sendError(res, 'No file uploaded', 400);
      }

      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const result = await MediaService.uploadImage(file, options, userId);
      return sendCreated(res, result, 'Image uploaded successfully');
    } catch (error) {
      if (error instanceof CloudinaryError) {
        return sendError(res, error.message, 400);
      }
      return sendError(res, 'Internal server error', 500);
    }
  }

  static async uploadVideo(req: Request, res: Response) {
    try {
      const options = validateUploadQuery(req.query);
      const file = req.file;

      if (!file) {
        return sendError(res, 'No file uploaded', 400);
      }

      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const result = await MediaService.uploadVideo(file, options, userId);
      return sendCreated(res, result, 'Video uploaded successfully');
    } catch (error) {
      if (error instanceof CloudinaryError) {
        return sendError(res, error.message, 400);
      }
      return sendError(res, 'Internal server error', 500);
    }
  }

  static async uploadDocument(req: Request, res: Response) {
    try {
      const options = validateUploadQuery(req.query);
      const file = req.file;

      if (!file) {
        return sendError(res, 'No file uploaded', 400);
      }

      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const result = await MediaService.uploadDocument(file, options, userId);
      return sendCreated(res, result, 'Document uploaded successfully');
    } catch (error) {
      if (error instanceof CloudinaryError) {
        return sendError(res, error.message, 400);
      }
      return sendError(res, 'Internal server error', 500);
    }
  }

  static async uploadImagesBulk(req: Request, res: Response) {
    try {
      const options = validateUploadQuery(req.query);
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return sendError(res, 'No files uploaded', 400);
      }

      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const result = await MediaService.uploadImagesBulk(files, options, userId);
      return sendCreated(res, result, 'Bulk images uploaded successfully');
    } catch (error) {
      if (error instanceof CloudinaryError) {
        return sendError(res, error.message, 400);
      }
      return sendError(res, 'Internal server error', 500);
    }
  }

  static async deleteMedia(req: Request, res: Response) {
    try {
      const assetId = req.params.assetId as string;
      if (!assetId) {
        return sendError(res, 'Asset ID is required', 400);
      }
      const result = await MediaService.deleteMedia(assetId);
      return sendSuccess(res, result, 'Media deleted successfully');
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Error', 400);
    }
  }

  static async deleteMediaBulk(req: Request, res: Response) {
    try {
      const { publicIds } = validateBulkDelete(req.body);
      const result = await MediaService.deleteMediaBulk(publicIds);
      return sendSuccess(res, result, 'Bulk media deleted successfully');
    } catch (error) {
      if (error instanceof CloudinaryError) {
        return sendError(res, error.message, 400);
      }
      return sendError(res, 'Internal server error', 500);
    }
  }
}
