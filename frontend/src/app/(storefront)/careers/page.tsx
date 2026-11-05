import type { Metadata } from "next";

import { CareersPageView } from "@/components/careers/careers-page-view";
import { careersMetadata } from "@/data/careers";

export const metadata: Metadata = {
  title: { absolute: careersMetadata.title },
  description: careersMetadata.description,
  keywords: [...careersMetadata.keywords],
  openGraph: {
    title: careersMetadata.title,
    description: careersMetadata.description,
  },
  twitter: {
    card: "summary",
    title: careersMetadata.title,
    description: careersMetadata.description,
  },
};

export default function CareersPage() {
  return <CareersPageView />;
}
