import { z } from "zod";

import type { InsightsConfigPayload, InsightsFormValues } from "@/types/insights";

export const insightsFormSchema = z.object({
  cards: z.array(
    z.object({
      category: z.string().trim().max(100),
      name: z.string().trim().max(200),
      publishedAt: z.string().trim(),
      imageUrl: z.string().trim().max(2048),
      imagePublicId: z.string().trim().max(500),
      description: z.string().max(200_000),
      order: z.string().trim(),
      active: z.boolean(),
    }),
  ),
  qaItems: z.array(
    z.object({
      question: z.string().trim().max(300),
      answer: z.string().max(200_000),
      order: z.string().trim(),
      active: z.boolean(),
    }),
  ),
});

export type InsightsFormErrors = {
  cards?: string;
  qaItems?: string;
};

function isBlankHtml(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim() === "";
}

export function validateInsightsForm(
  values: InsightsFormValues,
):
  | { success: true; data: InsightsFormValues }
  | { success: false; errors: InsightsFormErrors } {
  const result = insightsFormSchema.safeParse(values);
  if (!result.success) {
    return {
      success: false,
      errors: {
        cards: result.error.flatten().fieldErrors.cards?.[0],
        qaItems: result.error.flatten().fieldErrors.qaItems?.[0],
      },
    };
  }

  for (const [index, card] of values.cards.entries()) {
    if (!card.category.trim()) {
      return {
        success: false,
        errors: { cards: `Card ${index + 1} needs a category` },
      };
    }
    if (!card.name.trim()) {
      return {
        success: false,
        errors: { cards: `Card ${index + 1} needs a name` },
      };
    }
    if (!card.publishedAt.trim()) {
      return {
        success: false,
        errors: { cards: `Card ${index + 1} needs a date` },
      };
    }
  }

  for (const [index, item] of values.qaItems.entries()) {
    if (!item.question.trim()) {
      return {
        success: false,
        errors: { qaItems: `Q&A ${index + 1} needs a question` },
      };
    }
    if (isBlankHtml(item.answer)) {
      return {
        success: false,
        errors: { qaItems: `Q&A ${index + 1} needs an answer` },
      };
    }
  }

  return { success: true, data: result.data };
}

export function toInsightsConfigPayload(
  values: InsightsFormValues,
): InsightsConfigPayload {
  return {
    cards: values.cards
      .filter((card) => card.category.trim() && card.name.trim())
      .map((card, index) => {
        const order =
          card.order.trim() === "" ? index + 1 : Number(card.order);
        const dateValue = card.publishedAt.trim();
        const publishedAt = dateValue.includes("T")
          ? new Date(dateValue).toISOString()
          : new Date(`${dateValue}T00:00:00.000Z`).toISOString();
        return {
          category: card.category.trim(),
          name: card.name.trim(),
          publishedAt,
          imageUrl: card.imageUrl.trim(),
          imagePublicId: card.imagePublicId.trim(),
          description: card.description,
          order: Number.isFinite(order) ? order : index + 1,
          active: card.active,
        };
      }),
    qaItems: values.qaItems
      .filter((item) => item.question.trim() && !isBlankHtml(item.answer))
      .map((item, index) => {
        const order =
          item.order.trim() === "" ? index + 1 : Number(item.order);
        return {
          question: item.question.trim(),
          answer: item.answer,
          order: Number.isFinite(order) ? order : index + 1,
          active: item.active,
        };
      }),
  };
}
