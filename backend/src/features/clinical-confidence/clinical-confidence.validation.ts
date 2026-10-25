import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => {
    if (!value || value === '#' || value.startsWith('/') || value.startsWith('#')) return true;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'URL must be a path, hash link, or absolute http(s) URL');

const mediaUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => {
    if (!value) return true;
    return (
      z.string().url().safeParse(value).success &&
      (value.startsWith('http://') || value.startsWith('https://'))
    );
  }, 'Image URL must be empty or an absolute http(s) URL');

const cardSchema = z.object({
  imageUrl: mediaUrl.default(''),
  imagePublicId: z.string().trim().max(500).default(''),
  heading: z.string().trim().min(1, 'Card heading is required').max(300),
  description: z.string().trim().min(1, 'Card description is required').max(4000),
  buttonLabel: z.string().trim().max(100).default(''),
  buttonUrl: optionalUrl.default(''),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  active: z.boolean().default(true),
});

export const clinicalConfidenceConfigBodySchema = z.object({
  badgeText: z.string().trim().max(200).default(''),
  heading: z.string().trim().min(1, 'Heading is required').max(500),
  description: z.string().trim().min(1, 'Description is required').max(4000),
  button1Label: z.string().trim().max(100).default(''),
  button1Url: optionalUrl.default(''),
  button2Label: z.string().trim().max(100).default(''),
  button2Url: optionalUrl.default(''),
  backgroundImageUrl: mediaUrl.default(''),
  backgroundImagePublicId: z.string().trim().max(500).default(''),
  cards: z.array(cardSchema).max(20).default([]),
});

export type ClinicalConfidenceConfigBody = z.infer<typeof clinicalConfidenceConfigBodySchema>;

export function normalizeClinicalConfidenceConfigInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const value = raw as Record<string, unknown>;
  return {
    ...value,
    badgeText: String(value.badgeText ?? '').trim(),
    heading: String(value.heading ?? '').trim(),
    description: String(value.description ?? '').trim(),
    button1Label: String(value.button1Label ?? '').trim(),
    button1Url: String(value.button1Url ?? '').trim(),
    button2Label: String(value.button2Label ?? '').trim(),
    button2Url: String(value.button2Url ?? '').trim(),
    backgroundImageUrl: String(value.backgroundImageUrl ?? '').trim(),
    backgroundImagePublicId: String(value.backgroundImagePublicId ?? '').trim(),
    cards: Array.isArray(value.cards)
      ? value.cards.map((card) => {
          const item = (card && typeof card === 'object' ? card : {}) as Record<string, unknown>;
          return {
            imageUrl: String(item.imageUrl ?? '').trim(),
            imagePublicId: String(item.imagePublicId ?? '').trim(),
            heading: String(item.heading ?? '').trim(),
            description: String(item.description ?? '').trim(),
            buttonLabel: String(item.buttonLabel ?? '').trim(),
            buttonUrl: String(item.buttonUrl ?? '').trim(),
            sortOrder: item.sortOrder,
            active: item.active ?? true,
          };
        })
      : [],
  };
}
