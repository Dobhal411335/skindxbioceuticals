import { z } from 'zod';

export const adminIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const siteCodeParamSchema = z.object({
  siteCode: z.enum(['IN', 'COM', 'in', 'com']).transform((value) => value.toUpperCase() as 'IN' | 'COM'),
});

const dateInputSchema = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Invalid date',
  });

export const dashboardQuerySchema = z.object({
  from: dateInputSchema.optional(),
  to: dateInputSchema.optional(),
});

export type AdminIdParam = z.infer<typeof adminIdParamSchema>;
export type SiteCodeParam = z.infer<typeof siteCodeParamSchema>;
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
