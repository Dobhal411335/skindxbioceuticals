import { z } from 'zod';

/**
 * Zod schemas for the settings feature.
 * Add request validation schemas as endpoints are implemented.
 */

export const settingsIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type SettingsIdParam = z.infer<typeof settingsIdParamSchema>;
