import { CloudinaryValidationError } from '../cloudinary.errors';
import {
  ALLOWED_IMAGE_FORMATS,
  ALLOWED_PDF_FORMATS,
  ALLOWED_VIDEO_FORMATS,
  CLOUDINARY_CONSTANTS,
} from '../cloudinary.constants';
import { ResourceType } from '../cloudinary.types';

export function validateUpload(file: Express.Multer.File, resourceType: ResourceType): void {
  if (!file) {
    throw new CloudinaryValidationError('No file provided');
  }

  const extension = file.originalname.split('.').pop()?.toLowerCase() || '';

  if (resourceType === 'image') {
    if (!ALLOWED_IMAGE_FORMATS.includes(extension)) {
      throw new CloudinaryValidationError(`Unsupported image format: ${extension}`);
    }
    if (file.size > CLOUDINARY_CONSTANTS.MAX_IMAGE_SIZE_BYTES) {
      throw new CloudinaryValidationError('Image size exceeds the maximum allowed limit');
    }
  } else if (resourceType === 'video') {
    if (!ALLOWED_VIDEO_FORMATS.includes(extension)) {
      throw new CloudinaryValidationError(`Unsupported video format: ${extension}`);
    }
    if (file.size > CLOUDINARY_CONSTANTS.MAX_VIDEO_SIZE_BYTES) {
      throw new CloudinaryValidationError('Video size exceeds the maximum allowed limit');
    }
  } else if (resourceType === 'raw') {
    if (!ALLOWED_PDF_FORMATS.includes(extension)) {
      throw new CloudinaryValidationError(`Unsupported document format: ${extension}`);
    }
    if (file.size > CLOUDINARY_CONSTANTS.MAX_PDF_SIZE_BYTES) {
      throw new CloudinaryValidationError('Document size exceeds the maximum allowed limit');
    }
  } else {
    throw new CloudinaryValidationError(`Unsupported resource type: ${resourceType}`);
  }
}
