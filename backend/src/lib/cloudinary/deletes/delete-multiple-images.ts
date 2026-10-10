import { CLOUDINARY_CONSTANTS } from '../cloudinary.constants';
import { CloudinaryError, CloudinaryValidationError } from '../cloudinary.errors';
import { BulkDeleteResult } from '../cloudinary.types';
import { cloudinary } from '../cloudinary.config';

export async function deleteMultipleImages(publicIds: string[]): Promise<BulkDeleteResult> {
  if (!publicIds || publicIds.length === 0) {
    throw new CloudinaryValidationError('No publicIds provided for deletion');
  }

  if (publicIds.length > CLOUDINARY_CONSTANTS.MAX_MULTIPLE_DELETE_COUNT) {
    throw new CloudinaryValidationError(
      `Cannot delete more than ${CLOUDINARY_CONSTANTS.MAX_MULTIPLE_DELETE_COUNT} images at once`,
    );
  }

  try {
    const result = await cloudinary.api.delete_resources(publicIds, {
      invalidate: true,
    });

    const deleted: string[] = [];
    const failed: { publicId: string; error: string }[] = [];

    if (result.deleted) {
      for (const [publicId, status] of Object.entries(result.deleted)) {
        if (status === 'deleted') {
          deleted.push(publicId);
        } else {
          failed.push({ publicId, error: status as string });
        }
      }
    }

    return { deleted, failed };
  } catch (error) {
    throw new CloudinaryError('Failed to bulk delete images', error);
  }
}
