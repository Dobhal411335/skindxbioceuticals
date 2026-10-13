import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

export type DoctorServiceItemDto = {
  id: string;
  iconKey: string;
  name: string;
  description: string;
  readMoreUrl: string;
  order: number;
  active: boolean;
};

export type DoctorPageConfigDto = {
  id: string | null;
  siteCode: SiteCodeDto;
  aboutHeading: string;
  aboutDescription: string;
  aboutHighlights: string[];
  aboutButtonLabel: string;
  aboutButtonUrl: string;
  aboutImageUrl: string;
  aboutImagePublicId: string;
  aboutSecondaryImageUrl: string;
  aboutSecondaryImagePublicId: string;
  experienceYears: number | null;
  servicesHeading: string;
  servicesSubheading: string;
  services: DoctorServiceItemDto[];
  updatedAt: string | null;
};

export type DoctorServiceItemRecord = {
  id: string;
  iconKey: string;
  name: string;
  description: string;
  readMoreUrl: string;
  order: number;
  active: boolean;
};

export type DoctorPageConfigRecord = {
  id: string;
  siteId: string;
  aboutHeading: string;
  aboutDescription: string;
  aboutHighlights: string[];
  aboutButtonLabel: string;
  aboutButtonUrl: string;
  aboutImageUrl: string;
  aboutImagePublicId: string;
  aboutSecondaryImageUrl: string;
  aboutSecondaryImagePublicId: string;
  experienceYears: number | null;
  servicesHeading: string;
  servicesSubheading: string;
  updatedAt: Date;
  services: DoctorServiceItemRecord[];
};

export type DoctorServiceItemWrite = {
  iconKey: string;
  name: string;
  description: string;
  readMoreUrl: string;
  order: number;
  active: boolean;
};

export type DoctorPageConfigUpsertData = {
  aboutHeading: string;
  aboutDescription: string;
  aboutHighlights: string[];
  aboutButtonLabel: string;
  aboutButtonUrl: string;
  aboutImageUrl: string;
  aboutImagePublicId: string;
  aboutSecondaryImageUrl: string;
  aboutSecondaryImagePublicId: string;
  experienceYears: number | null;
  servicesHeading: string;
  servicesSubheading: string;
  services: DoctorServiceItemWrite[];
};
