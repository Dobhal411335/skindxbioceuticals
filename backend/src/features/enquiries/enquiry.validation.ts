import { z } from 'zod';

/**
 * Zod schemas for the enquiry feature.
 * Add request validation schemas as endpoints are implemented.
 */

export const enquiryIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type EnquiryIdParam = z.infer<typeof enquiryIdParamSchema>;
