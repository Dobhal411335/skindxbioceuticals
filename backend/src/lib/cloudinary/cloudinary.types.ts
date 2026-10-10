import { ALLOWED_FEATURE_FOLDERS, ALLOWED_SITE_CODES } from './cloudinary.constants';

export type SiteCode = (typeof ALLOWED_SITE_CODES)[number];
export type FeatureFolder = (typeof ALLOWED_FEATURE_FOLDERS)[number];

export type ResourceType = 'image' | 'video' | 'raw' | 'auto';

export interface UploadOptions {
  siteCode: SiteCode;
  feature: FeatureFolder;
  entityId?: string;
  resourceType?: ResourceType;
  format?: string;
}

export interface UploadResult {
  publicId: string;
  assetId?: string;
  url: string;
  secureUrl: string;
  format: string;
  resourceType: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
}

export interface BulkUploadResult {
  successful: UploadResult[];
  failed: { file: string; error: string }[];
}

export interface DeleteResult {
  publicId: string;
  result: string; // 'ok', 'not_found', etc.
}

export interface BulkDeleteResult {
  deleted: string[];
  failed: { publicId: string; error: string }[];
}
