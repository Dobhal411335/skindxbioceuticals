import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().max(100).optional().nullable(),
});

export const addressIdParamSchema = z.object({
  addressId: z.string().uuid(),
});

export const addressBodySchema = z.object({
  label: z.string().trim().max(100).optional().nullable(),
  line1: z.string().trim().min(1, 'Address line 1 is required').max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().min(1, 'State is required').max(100),
  postalCode: z.string().trim().min(1, 'Postal code is required').max(20),
  country: z.string().trim().length(2).default('IN'),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = addressBodySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
);

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressBodyInput = z.infer<typeof addressBodySchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type AddressIdParam = z.infer<typeof addressIdParamSchema>;
