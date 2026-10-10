import { cloudinary } from '../cloudinary.config';
import { CloudinaryError } from '../cloudinary.errors';
import { UploadOptions, UploadResult } from '../cloudinary.types';
import { buildFolderPath } from '../utils/build-folder-path';
import { normalizeUploadResult } from '../utils/normalize-upload-result';
import { validateUpload } from '../utils/validate-upload';

export async function uploadSingleVideo(
  file: Express.Multer.File,
  options: UploadOptions,
): Promise<UploadResult> {
  try {
    validateUpload(file, 'video');

    const folder = buildFolderPath(options);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'video',
          format: options.format,
        },
        (error, result) => {
          if (error) {
            return reject(new CloudinaryError('Failed to upload video to Cloudinary', error));
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
    throw new CloudinaryError('An unexpected error occurred during video upload', error);
  }
}
