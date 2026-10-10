import { z } from 'zod';
import { ALLOWED_FEATURE_FOLDERS, ALLOWED_SITE_CODES } from './cloudinary.constants';

export const siteCodeSchema = z.enum(ALLOWED_SITE_CODES);
export const featureFolderSchema = z.enum(ALLOWED_FEATURE_FOLDERS);

export const uploadOptionsSchema = z.object({
  siteCode: siteCodeSchema,
  feature: featureFolderSchema,
  entityId: z.string().optional(),
});
