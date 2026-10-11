import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => value === '' || z.string().url().safeParse(value).success, {
    message: 'Invalid URL',
  });

const imageRefSchema = z.object({
  url: z.string().trim().max(2000).default(''),
  publicId: z.string().trim().max(500).default(''),
});

const tenDigitPhone = z
  .string()
  .trim()
  .regex(/^\d{10}$/, 'Each contact number must be exactly 10 digits');

const optionalWhatsapp = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d{10}$/.test(value), {
    message: 'WhatsApp number must be exactly 10 digits',
  });

const emailEntry = z.string().trim().email('Invalid email address').max(320);

export const companyBasicInfoBodySchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required').max(200),
  companyDomainName: z.string().trim().min(1, 'Company domain name is required').max(255),
  contactNumbers: z.array(tenDigitPhone).max(20).default([]),
  whatsappNumber: optionalWhatsapp.default(''),
  mainLogo: imageRefSchema.default({ url: '', publicId: '' }),
  footerLogo: imageRefSchema.default({ url: '', publicId: '' }),
  mobileUiLogo: imageRefSchema.default({ url: '', publicId: '' }),
  emails: z.array(emailEntry).max(20).default([]),
  officeAddresses: z.array(z.string().trim().min(1).max(1000)).max(20).default([]),
  googleAddress: z.string().max(20_000).default(''),
  googleUrl: optionalUrl.default(''),
  googleLink: optionalUrl.default(''),
  facebookLink: optionalUrl.default(''),
  instagramLink: optionalUrl.default(''),
  youtubeLink: optionalUrl.default(''),
  googleMapLink: optionalUrl.default(''),
  googleTrackingTag: z.string().max(50_000).default(''),
  titleTagForMainLandingPage: z.string().trim().max(300).default(''),
  keywords: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
});

export type CompanyBasicInfoBody = z.infer<typeof companyBasicInfoBodySchema>;

/** Normalize phones/arrays before Zod parse. */
export function normalizeCompanyBasicInfoInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;

  const normalizeArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  };

  const normalizePhones = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) =>
        String(item ?? '')
          .replace(/\D/g, '')
          .slice(0, 10),
      )
      .filter(Boolean);
  };

  const normalizeImage = (value: unknown) => {
    if (!value || typeof value !== 'object') {
      return { url: '', publicId: '' };
    }
    const image = value as Record<string, unknown>;
    return {
      url: String(image.url ?? '').trim(),
      publicId: String(image.publicId ?? image.key ?? '').trim(),
    };
  };

  return {
    ...payload,
    companyName: String(payload.companyName ?? '').trim(),
    companyDomainName: String(payload.companyDomainName ?? '').trim(),
    contactNumbers: normalizePhones(payload.contactNumbers),
    whatsappNumber: String(payload.whatsappNumber ?? '')
      .replace(/\D/g, '')
      .slice(0, 10),
    mainLogo: normalizeImage(payload.mainLogo),
    footerLogo: normalizeImage(payload.footerLogo),
    mobileUiLogo: normalizeImage(payload.mobileUiLogo),
    emails: normalizeArray(payload.emails),
    officeAddresses: normalizeArray(payload.officeAddresses),
    googleAddress: String(payload.googleAddress ?? ''),
    googleUrl: String(payload.googleUrl ?? '').trim(),
    googleLink: String(payload.googleLink ?? '').trim(),
    facebookLink: String(payload.facebookLink ?? '').trim(),
    instagramLink: String(payload.instagramLink ?? '').trim(),
    youtubeLink: String(payload.youtubeLink ?? '').trim(),
    googleMapLink: String(payload.googleMapLink ?? '').trim(),
    googleTrackingTag: String(payload.googleTrackingTag ?? ''),
    titleTagForMainLandingPage: String(payload.titleTagForMainLandingPage ?? '').trim(),
    keywords: normalizeArray(payload.keywords),
  };
}
