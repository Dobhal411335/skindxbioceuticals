import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

export type NavbarSubSectionDto = {
  id: string;
  title: string;
  url: string;
  active: boolean;
  order: number;
};

export type NavbarSectionDto = {
  id: string;
  siteCode: SiteCodeDto;
  title: string;
  url: string;
  active: boolean;
  order: number;
  subSections: NavbarSubSectionDto[];
  createdAt: string;
  updatedAt: string;
};

export type NavbarSubSectionRecord = {
  id: string;
  sectionId: string;
  title: string;
  url: string;
  active: boolean;
  order: number;
};

export type NavbarSectionRecord = {
  id: string;
  siteId: string;
  title: string;
  url: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  subSections: NavbarSubSectionRecord[];
};

export type NavbarSubSectionWrite = {
  title: string;
  url: string;
  active: boolean;
  order: number;
};

export type NavbarSectionWrite = {
  title: string;
  url: string;
  active: boolean;
  order: number;
  subSections: NavbarSubSectionWrite[];
};
