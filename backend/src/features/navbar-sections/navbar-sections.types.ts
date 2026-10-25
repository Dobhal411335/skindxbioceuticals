import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

export type NavbarSubSectionDto = {
  id: string;
  title: string;
  url: string;
  description: string;
  active: boolean;
  order: number;
};

export type NavbarSectionDto = {
  id: string;
  siteCode: SiteCodeDto;
  title: string;
  url: string;
  menuHeading: string;
  menuDescription: string;
  active: boolean;
  order: number;
  subSections: NavbarSubSectionDto[];
  createdAt: string;
  updatedAt: string;
};

export type NavbarSubSectionRecord = NavbarSubSectionDto & { sectionId: string };

export type NavbarSectionRecord = Omit<NavbarSectionDto, 'siteCode' | 'createdAt' | 'updatedAt' | 'subSections'> & {
  id: string;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
  subSections: NavbarSubSectionRecord[];
};

export type NavbarSubSectionWrite = {
  title: string;
  url: string;
  description: string;
  active: boolean;
  order: number;
};

export type NavbarSectionWrite = {
  title: string;
  url: string;
  menuHeading: string;
  menuDescription: string;
  active: boolean;
  order: number;
  subSections: NavbarSubSectionWrite[];
};
