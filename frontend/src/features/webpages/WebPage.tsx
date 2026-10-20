"use client";

import { Design1Page } from "@/features/webpages/designs/Design1Page";
import { Design2Page } from "@/features/webpages/designs/Design2Page";
import { Design3Page } from "@/features/webpages/designs/Design3Page";
import { Design4Page } from "@/features/webpages/designs/Design4Page";
import { Design5Page } from "@/features/webpages/designs/Design5Page";
import { Design6Page } from "@/features/webpages/designs/Design6Page";
import { Design7Page } from "@/features/webpages/designs/Design7Page";
import { Design9Page } from "@/features/webpages/designs/Design9Page";
import type { StorefrontWebpage } from "@/features/webpages/webpage.types";

export function WebPage({ data }: { data: StorefrontWebpage }) {
  const template = String(data.templateType || "design1").toLowerCase();

  if (template === "design1") return <Design1Page data={data} />;
  if (template === "design2") return <Design2Page data={data} />;
  if (template === "design3") return <Design3Page data={data} />;
  if (template === "design4") return <Design4Page data={data} />;
  if (template === "design5") return <Design5Page data={data} />;
  if (template === "design6") return <Design6Page data={data} />;
  if (template === "design7") return <Design7Page data={data} />;
  if (template === "design9") return <Design9Page data={data} />;

  // Unknown / unsupported (e.g. design8): fall back to design1 layout
  return <Design1Page data={data} />;
}
