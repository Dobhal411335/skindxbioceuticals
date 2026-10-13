import type {
  InsightCardFormValues,
  InsightQaFormValues,
  InsightsConfigDto,
  InsightsFormValues,
} from "@/types/insights";

function toDateInputValue(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso.slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

export function createEmptyCard(): InsightCardFormValues {
  return {
    category: "",
    name: "",
    publishedAt: new Date().toISOString().slice(0, 10),
    imageUrl: "",
    imagePublicId: "",
    description: "",
    order: "",
    active: true,
  };
}

export function createEmptyQa(): InsightQaFormValues {
  return {
    question: "",
    answer: "",
    order: "",
    active: true,
  };
}

export function createEmptyFormValues(): InsightsFormValues {
  return {
    cards: [],
    qaItems: [],
  };
}

export function dtoToFormValues(dto: InsightsConfigDto): InsightsFormValues {
  return {
    cards: (dto.cards || []).map((card) => ({
      category: card.category ?? "",
      name: card.name ?? "",
      publishedAt: toDateInputValue(card.publishedAt ?? ""),
      imageUrl: card.imageUrl ?? "",
      imagePublicId: card.imagePublicId ?? "",
      description: card.description ?? "",
      order: String(card.order ?? ""),
      active: card.active !== false,
    })),
    qaItems: (dto.qaItems || []).map((item) => ({
      question: item.question ?? "",
      answer: item.answer ?? "",
      order: String(item.order ?? ""),
      active: item.active !== false,
    })),
  };
}

export function moveItem<T>(items: T[], index: number, direction: "up" | "down"): T[] {
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  const [removed] = next.splice(index, 1);
  next.splice(target, 0, removed as T);
  return next;
}
