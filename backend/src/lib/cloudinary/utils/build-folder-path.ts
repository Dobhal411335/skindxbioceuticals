import { UploadOptions } from '../cloudinary.types';

export function buildFolderPath(options: UploadOptions): string {
  const base = 'skindx';
  const site = options.siteCode.toLowerCase();
  const feature = options.feature;

  if (options.entityId) {
    return `${base}/${site}/${feature}/${options.entityId}`;
  }

  return `${base}/${site}/${feature}`;
}
