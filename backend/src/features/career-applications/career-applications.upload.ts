import { cloudinary } from '@/lib/cloudinary/cloudinary.config';
import { CloudinaryError } from '@/lib/cloudinary/cloudinary.errors';
import { buildFolderPath } from '@/lib/cloudinary/utils/build-folder-path';
import { normalizeUploadResult } from '@/lib/cloudinary/utils/normalize-upload-result';
import { ValidationError } from '@/utils/AppError';
import { assertResumeFile, resumeExtension } from './career-applications.validation';

export type UploadedResume = {
  url: string;
  publicId: string;
};

function safeBaseName(originalName: string): string {
  const withoutExt = originalName.replace(/\.(pdf|docx?)$/i, '').trim() || 'resume';
  return (
    withoutExt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'resume'
  );
}

export async function uploadCareerResume(
  file: Express.Multer.File,
  siteCode: 'IN' | 'COM',
): Promise<UploadedResume> {
  assertResumeFile(file);
  const extension = resumeExtension(file);
  const folder = buildFolderPath({
    siteCode,
    feature: 'documents',
    entityId: 'careers',
  });
  const publicId = `${safeBaseName(file.originalname)}-${Date.now().toString(36)}.${extension}`;

  try {
    const result = await new Promise<ReturnType<typeof normalizeUploadResult>>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'raw',
        },
        (error, uploaded) => {
          if (error || !uploaded) {
            reject(new CloudinaryError('Failed to upload resume', error));
            return;
          }
          resolve(normalizeUploadResult(uploaded));
        },
      );
      uploadStream.end(file.buffer);
    });

    return {
      url: result.secureUrl,
      publicId: result.publicId,
    };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof CloudinaryError) {
      throw error;
    }
    throw new CloudinaryError('Failed to upload resume', error);
  }
}

export function buildCareerResumeAccessUrl(publicId: string, mimeType: string): string {
  const format =
    mimeType === 'application/msword'
      ? 'doc'
      : mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ? 'docx'
        : 'pdf';

  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: 'raw',
    type: 'upload',
    expires_at: Math.floor(Date.now() / 1000) + 15 * 60,
  });
}
