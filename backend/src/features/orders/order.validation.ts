import { z } from 'zod';

export const orderIdParamSchema = z.object({
  orderId: z.string().uuid(),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export type OrderIdParam = z.infer<typeof orderIdParamSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
