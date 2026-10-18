import { z } from 'zod';
import { siteCodeParamSchema } from '@/features/admin/admin.validation';

const documentRefSchema = z.object({
  url: z.string().url().max(2048),
  publicId: z.string().trim().min(1).max(512),
});

const optionalDocumentRefSchema = documentRefSchema.nullable().optional();

export const vendorApplicationCreateBodySchema = z
  .object({
    businessName: z.string().trim().min(1).max(200),
    businessType: z.string().trim().min(1).max(120),
    industryCategory: z.string().trim().min(1).max(120),
    yearOfEstablishment: z.string().trim().min(1).max(20),
    legalStructure: z.string().trim().min(1).max(120),
    isGstRegistered: z.boolean().default(false),
    gstNumber: z.string().trim().max(20).optional().nullable(),
    panNumber: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN number'),
    msmeNumber: z.string().trim().max(50).optional().nullable(),
    gstCertificate: optionalDocumentRefSchema,
    panCard: documentRefSchema,
    msmeCertificate: optionalDocumentRefSchema,
    cancelledCheque: documentRefSchema,
    productCatalog: documentRefSchema,
    businessCard: optionalDocumentRefSchema,
    aadhaarUpload: optionalDocumentRefSchema,
    authorizedPersonPhoto: documentRefSchema,
    contactPerson: z.string().trim().min(1).max(120),
    designation: z.string().trim().min(1).max(120),
    mobile: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
    alternateMobile: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/)
      .optional()
      .nullable()
      .or(z.literal('').transform(() => null)),
    email: z.string().trim().email().transform((v) => v.toLowerCase()),
    whatsappNumber: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/)
      .optional()
      .nullable()
      .or(z.literal('').transform(() => null)),
    address: z.string().trim().min(1).max(500),
    city: z.string().trim().min(1).max(120),
    state: z.string().trim().min(1).max(120),
    pincode: z.string().trim().regex(/^\d{6}$/, 'Invalid pincode'),
    country: z.string().trim().min(1).max(120),
    deliveryCapability: z.string().trim().min(1).max(500),
    bankName: z.string().trim().min(1).max(120),
    accountHolderName: z.string().trim().min(1).max(120),
    accountNumber: z.string().trim().min(5).max(40),
    ifscCode: z.string().trim().min(5).max(20),
    branch: z.string().trim().min(1).max(120),
    qualityCertifications: z.string().trim().max(2000).optional().nullable(),
    returnPolicy: z.string().trim().min(1).max(2000),
    aadhaarNumber: z.string().trim().max(20).optional().nullable(),
    referredBy: z.string().trim().max(200).optional().nullable(),
    additionalNotes: z.string().trim().max(2000).optional().nullable(),
    website: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isGstRegistered) {
      if (!data.gstNumber || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(data.gstNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Valid GST number is required when GST registered',
          path: ['gstNumber'],
        });
      }
    }
  });

export const vendorApplicationListQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'all']).optional().default('all'),
  q: z.string().trim().max(200).optional(),
});

export const vendorApplicationIdParamSchema = siteCodeParamSchema.extend({
  applicationId: z.string().uuid(),
});

export const vendorApplicationStatusPatchSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const vendorCredentialsListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  isActive: z
    .enum(['true', 'false', 'all'])
    .optional()
    .default('all'),
});

export const vendorCredentialIdParamSchema = siteCodeParamSchema.extend({
  applicationId: z.string().uuid(),
});

export const vendorCredentialActivePatchSchema = z.object({
  isActive: z.boolean(),
});

export type VendorApplicationCreateBody = z.infer<typeof vendorApplicationCreateBodySchema>;
export type VendorApplicationListQuery = z.infer<typeof vendorApplicationListQuerySchema>;
export type VendorApplicationStatusPatch = z.infer<typeof vendorApplicationStatusPatchSchema>;
export type VendorCredentialsListQuery = z.infer<typeof vendorCredentialsListQuerySchema>;
export type VendorCredentialActivePatch = z.infer<typeof vendorCredentialActivePatchSchema>;
