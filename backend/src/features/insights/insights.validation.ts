import { z } from 'zod';

const optionalImageUrl = z
  .string()
  .trim()
  .max(2048)
  .default('')
  .refine(
    (value) =>
      value === '' ||
      value.startsWith('https://') ||
      value.startsWith('http://'),
    'Image URL must be http(s) when provided',
  );

const insightCardSchema = z.object({
  category: z.string().trim().min(1, 'Category is required').max(100),
  name: z.string().trim().min(1, 'Insight name is required').max(200),
  publishedAt: z.coerce.date(),
  imageUrl: optionalImageUrl,
  imagePublicId: z.string().trim().max(500).default(''),
  description: z.string().max(200_000).default(''),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(10_000).default(0),
});

const insightQaSchema = z.object({
  question: z.string().trim().min(1, 'Question is required').max(300),
  answer: z.string().trim().min(1, 'Answer is required').max(200_000),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(10_000).default(0),
});

export const insightsConfigBodySchema = z.object({
  cards: z.array(insightCardSchema).max(50).default([]),
  qaItems: z.array(insightQaSchema).max(50).default([]),
});

export type InsightsConfigBody = z.infer<typeof insightsConfigBodySchema>;

/** Normalize insight payload aliases before Zod parse. */
export function normalizeInsightsConfigInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;

  const cards = Array.isArray(payload.cards)
    ? payload.cards
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => {
          const card = item as Record<string, unknown>;
          const category = String(card.category ?? '').trim();
          const name = String(card.name ?? card.title ?? '').trim();
          if (!category || !name) return null;

          const publishedRaw = card.publishedAt ?? card.date ?? card.published_at;
          let publishedAt: string | Date | number | undefined;
          if (
            typeof publishedRaw === 'string' ||
            typeof publishedRaw === 'number' ||
            publishedRaw instanceof Date
          ) {
            publishedAt = publishedRaw;
          } else {
            publishedAt = new Date().toISOString();
          }

          return {
            category,
            name,
            publishedAt,
            imageUrl: String(card.imageUrl ?? card.image_url ?? '').trim(),
            imagePublicId: String(
              card.imagePublicId ?? card.image_public_id ?? '',
            ).trim(),
            description: String(card.description ?? '').trim(),
            active: card.active ?? true,
            order:
              card.order === '' || card.order === undefined || card.order === null
                ? index + 1
                : Number(card.order),
          };
        })
        .filter(Boolean)
    : [];

  const qaSource = Array.isArray(payload.qaItems)
    ? payload.qaItems
    : Array.isArray(payload.qa)
      ? payload.qa
      : [];

  const qaItems = qaSource
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const qa = item as Record<string, unknown>;
      const question = String(qa.question ?? qa.name ?? '').trim();
      const answer = String(qa.answer ?? qa.description ?? '').trim();
      if (!question || !answer) return null;
      return {
        question,
        answer,
        active: qa.active ?? true,
        order:
          qa.order === '' || qa.order === undefined || qa.order === null
            ? index + 1
            : Number(qa.order),
      };
    })
    .filter(Boolean);

  return {
    ...payload,
    cards,
    qaItems,
  };
}
