import type { SiteCode } from "@/types/auth";

export type NavbarSubSectionDto = {
  id: string;
  title: string;
  url: string;
  active: boolean;
  order: number;
};

export type NavbarSectionDto = {
  id: string;
  siteCode: SiteCode;
  title: string;
  url: string;
  active: boolean;
  order: number;
  subSections: NavbarSubSectionDto[];
  createdAt: string;
  updatedAt: string;
};

export type NavbarSubSectionFormValues = {
  title: string;
  url: string;
  order: string;
  active: boolean;
};

export type NavbarSectionFormValues = {
  title: string;
  url: string;
  order: string;
  active: boolean;
  subSections: NavbarSubSectionFormValues[];
};

export type NavbarSectionPayload = {
  title: string;
  url: string;
  active: boolean;
  order?: number;
  subSections: Array<{
    title: string;
    url: string;
    active: boolean;
    order: number;
  }>;
};
