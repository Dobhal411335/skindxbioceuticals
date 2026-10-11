import { cloudinary } from '../cloudinary.config';
import { CloudinaryError } from '../cloudinary.errors';
import { DeleteResult, ResourceType } from '../cloudinary.types';
import { normalizeDeleteResult } from '../utils/normalize-delete-result';

export type DeleteAssetOptions = {
  /** Cloudinary resource type. Defaults to `image`. Videos/PDFs need `video` / `raw`. */
  resourceType?: Exclude<ResourceType, 'auto'>;
};

export async function deleteSingleImage(
  publicId: string,
  options: DeleteAssetOptions = {},
): Promise<DeleteResult> {
  if (!publicId) {
    throw new CloudinaryError('No publicId provided for deletion');
  }

  const resourceType = options.resourceType ?? 'image';

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: resourceType,
    });

    return normalizeDeleteResult(publicId, result);
  } catch (error) {
    throw new CloudinaryError(`Failed to delete image with publicId: ${publicId}`, error);
  }
}
