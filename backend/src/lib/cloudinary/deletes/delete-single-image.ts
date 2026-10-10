import { cloudinary } from '../cloudinary.config';
import { CloudinaryError } from '../cloudinary.errors';
import { DeleteResult } from '../cloudinary.types';
import { normalizeDeleteResult } from '../utils/normalize-delete-result';

export async function deleteSingleImage(publicId: string): Promise<DeleteResult> {
  if (!publicId) {
    throw new CloudinaryError('No publicId provided for deletion');
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });

    return normalizeDeleteResult(publicId, result);
  } catch (error) {
    throw new CloudinaryError(`Failed to delete image with publicId: ${publicId}`, error);
  }
}
