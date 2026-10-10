import pLimit from 'p-limit';
import { CLOUDINARY_CONSTANTS } from '../cloudinary.constants';
import { CloudinaryValidationError } from '../cloudinary.errors';
import { BulkUploadResult, UploadOptions } from '../cloudinary.types';
import { uploadSingleImage } from './upload-single-image';

export async function uploadMultipleImages(
  files: Express.Multer.File[],
  options: UploadOptions,
): Promise<BulkUploadResult> {
  if (!files || files.length === 0) {
    throw new CloudinaryValidationError('No files provided');
  }

  if (files.length > CLOUDINARY_CONSTANTS.MAX_MULTIPLE_UPLOAD_COUNT) {
    throw new CloudinaryValidationError(
      `Cannot upload more than ${CLOUDINARY_CONSTANTS.MAX_MULTIPLE_UPLOAD_COUNT} images at once`,
    );
  }

  const limit = pLimit(CLOUDINARY_CONSTANTS.CONCURRENCY_LIMIT);

  const uploadPromises = files.map((file) =>
    limit(async () => {
      try {
        const result = await uploadSingleImage(file, options);
        return { success: true, result, file: file.originalname };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: errorMessage, file: file.originalname };
      }
    }),
  );

  const results = await Promise.all(uploadPromises);

  const successful = results
    .filter((r) => r.success)
    .map((r) => r.result!);

  const failed = results
    .filter((r) => !r.success)
    .map((r) => ({ file: r.file, error: r.error! }));

  return { successful, failed };
}
