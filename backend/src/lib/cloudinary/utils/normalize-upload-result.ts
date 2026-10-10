import { UploadResult } from '../cloudinary.types';

export function normalizeUploadResult(result: any): UploadResult {
  return {
    publicId: result.public_id,
    assetId: result.asset_id,
    url: result.url,
    secureUrl: result.secure_url,
    format: result.format || result.resource_type,
    resourceType: result.resource_type,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    duration: result.duration,
  };
}
