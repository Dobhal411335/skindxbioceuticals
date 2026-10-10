import { z } from 'zod';
import { uploadOptionsSchema } from '../../lib/cloudinary';

export const mediaUploadQuerySchema = uploadOptionsSchema;

export type MediaUploadQuery = z.infer<typeof mediaUploadQuerySchema>;

export const bulkDeleteSchema = z.object({
  publicIds: z.array(z.string()).min(1).max(20),
});

export type BulkDeleteDto = z.infer<typeof bulkDeleteSchema>;
