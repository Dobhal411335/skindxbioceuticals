import { z } from 'zod';

const faqItemSchema = z.object({
  question: z.string().trim().min(1, 'Question is required').max(300),
  answer: z.string().trim().min(1, 'Answer is required').max(5000),
  showOnLanding: z.boolean().default(false),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(10_000).default(0),
});

const faqSectionSchema = z.object({
  title: z.string().trim().min(1, 'Section heading is required').max(200),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(10_000).default(0),
  items: z.array(faqItemSchema).max(50).default([]),
});

export const faqConfigBodySchema = z.object({
  sections: z.array(faqSectionSchema).max(50).default([]),
});

export const faqPublicQuerySchema = z.object({
  landing: z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((value) => value === 'true' || value === '1'),
});

export type FaqConfigBody = z.infer<typeof faqConfigBodySchema>;

/** Normalize nested arrays before Zod parse. */
export function normalizeFaqConfigInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;

  const sections = Array.isArray(payload.sections)
    ? payload.sections
        .filter((item) => item && typeof item === 'object')
        .map((item, sectionIndex) => {
          const section = item as Record<string, unknown>;
          const title = String(section.title ?? section.heading ?? '').trim();
          if (!title) return null;

          const items = Array.isArray(section.items)
            ? section.items
                .filter((entry) => entry && typeof entry === 'object')
                .map((entry, itemIndex) => {
                  const questionEntry = entry as Record<string, unknown>;
                  const question = String(
                    questionEntry.question ?? questionEntry.heading ?? '',
                  ).trim();
                  const answer = String(
                    questionEntry.answer ?? questionEntry.description ?? '',
                  ).trim();
                  if (!question || !answer) return null;
                  return {
                    question,
                    answer,
                    showOnLanding:
                      questionEntry.showOnLanding ??
                      questionEntry.show_on_landing ??
                      false,
                    active: questionEntry.active ?? true,
                    order:
                      questionEntry.order === '' ||
                      questionEntry.order === undefined ||
                      questionEntry.order === null
                        ? itemIndex + 1
                        : Number(questionEntry.order),
                  };
                })
                .filter(Boolean)
            : [];

          return {
            title,
            active: section.active ?? true,
            order:
              section.order === '' ||
              section.order === undefined ||
              section.order === null
                ? sectionIndex + 1
                : Number(section.order),
            items,
          };
        })
        .filter(Boolean)
    : [];

  return {
    ...payload,
    sections,
  };
}
