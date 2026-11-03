import { cloudinary } from '../cloudinary.config';
import { CloudinaryError } from '../cloudinary.errors';
import { UploadOptions, UploadResult } from '../cloudinary.types';
import { buildFolderPath } from '../utils/build-folder-path';
import { normalizeUploadResult } from '../utils/normalize-upload-result';
import { validateUpload } from '../utils/validate-upload';

/** Raw Cloudinary URLs need a `.pdf` suffix or browsers treat them as downloads. */
function buildPdfPublicId(originalName: string): string {
  const withoutExt = originalName.replace(/\.pdf$/i, '').trim() || 'document';
  const safeBase = withoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'document';
  const unique = Date.now().toString(36);
  return `${safeBase}-${unique}.pdf`;
}

export async function uploadSinglePdf(
  file: Express.Multer.File,
  options: UploadOptions,
): Promise<UploadResult> {
  try {
    validateUpload(file, 'raw');

    const folder = buildFolderPath(options);
    const publicId = buildPdfPublicId(file.originalname);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          // Extension must be in public_id for raw assets or delivery URLs omit `.pdf`.
          public_id: publicId,
          resource_type: 'raw',
        },
        (error, result) => {
          if (error) {
            return reject(new CloudinaryError('Failed to upload PDF to Cloudinary', error));
          }
          if (!result) {
            return reject(new CloudinaryError('No result returned from Cloudinary'));
          }
          resolve(normalizeUploadResult(result));
        },
      );

      uploadStream.end(file.buffer);
    });
  } catch (error) {
    if (error instanceof CloudinaryError) {
      throw error;
    }
    throw new CloudinaryError('An unexpected error occurred during PDF upload', error);
  }
}
