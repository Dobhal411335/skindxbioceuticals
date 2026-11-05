import { cloudinary } from '../cloudinary.config';

/** CDN delivery of raw PDFs is blocked (401 deny or ACL failure). This URL is fetched only on the server. */
const DOWNLOAD_TTL_SECONDS = 120;

export function rawPublicIdFromDeliveryUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('res.cloudinary.com')) {
      return null;
    }
    const marker = '/raw/upload/';
    const index = parsed.pathname.indexOf(marker);
    if (index < 0) {
      return null;
    }
    let publicId = decodeURIComponent(parsed.pathname.slice(index + marker.length));
    publicId = publicId.replace(/^s--[^/]+--\//, '');
    publicId = publicId.replace(/^v\d+\//, '');
    return publicId || null;
  } catch {
    return null;
  }
}

export function buildRawPdfDownloadUrl(publicId: string): string {
  return cloudinary.utils.private_download_url(publicId, 'pdf', {
    resource_type: 'raw',
    type: 'upload',
    expires_at: Math.floor(Date.now() / 1000) + DOWNLOAD_TTL_SECONDS,
  });
}
