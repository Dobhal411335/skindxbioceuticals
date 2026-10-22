import { z } from 'zod';

const siteCodeSchema = z
  .enum(['IN', 'COM', 'in', 'com'])
  .transform((value) => value.toUpperCase() as 'IN' | 'COM');

const dateOnlySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

const booleanQuerySchema = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .optional()
  .transform((value) => {
    if (value === undefined) return false;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  });

export const adminOrderLogQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
    date: dateOnlySchema.optional(),
    all: booleanQuerySchema,
    q: z.string().trim().max(120).optional(),
  })
  .transform((value) => {
    const all = value.all === true;
    const q = value.q?.trim() ? value.q.trim() : undefined;
    return {
      page: value.page,
      pageSize: value.pageSize,
      all,
      date: all ? undefined : value.date,
      q,
    };
  });

export const adminOrderEnquiryQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
    date: dateOnlySchema.optional(),
    all: booleanQuerySchema,
    status: z.string().trim().optional(),
    q: z.string().trim().max(120).optional(),
  })
  .transform((value) => {
    const all = value.all === true;
    const q = value.q?.trim() ? value.q.trim() : undefined;
    const status = value.status?.trim() && value.status.toUpperCase() !== 'ALL'
      ? value.status.trim().toUpperCase()
      : undefined;
    return {
      page: value.page,
      pageSize: value.pageSize,
      all,
      date: all ? undefined : value.date,
      status,
      q,
    };
  });

export const adminOrderLogSiteParamSchema = z.object({
  siteCode: siteCodeSchema,
});

export const adminOrderIdParamSchema = z.object({
  siteCode: siteCodeSchema,
  orderId: z.string().uuid('Invalid order ID'),
});

export const adminOrderUpdateStatusBodySchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ]),
  message: z.string().trim().max(1000).optional().nullable(),
});

export type AdminOrderLogQuery = z.infer<typeof adminOrderLogQuerySchema>;
export type AdminOrderEnquiryQuery = z.infer<typeof adminOrderEnquiryQuerySchema>;
export type AdminOrderUpdateStatusBody = z.infer<typeof adminOrderUpdateStatusBodySchema>;

export function resolveAdminOrderLogDayRange(input: {
  all: boolean;
  date?: string;
  now?: Date;
}): { mode: 'day' | 'all'; date: string | null; from?: Date; to?: Date } {
  if (input.all) {
    return { mode: 'all', date: null };
  }

  const now = input.now ?? new Date();
  const date =
    input.date ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const from = new Date(`${date}T00:00:00.000`);
  const to = new Date(`${date}T23:59:59.999`);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error('Invalid date');
  }

  return { mode: 'day', date, from, to };
}
