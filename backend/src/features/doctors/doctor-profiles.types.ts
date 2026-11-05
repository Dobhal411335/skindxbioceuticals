import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

export type DoctorProfileDto = {
  id: string;
  siteCode: SiteCodeDto;
  name: string;
  specializations: string[];
  about: string;
  experienceYears: number;
  state: string;
  city: string;
  phone: string;
  email: string;
  location: string;
  education: string;
  degree: string;
  workHistory: string;
  workDays: string;
  photoUrl: string;
  photoPublicId: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

/** Storefront-facing doctor card fields (no admin/media internals). */
export type DoctorProfilePublicDto = {
  id: string;
  siteCode: SiteCodeDto;
  name: string;
  specializations: string[];
  about: string;
  experienceYears: number;
  state: string;
  city: string;
  phone: string;
  email: string;
  location: string;
  education: string;
  degree: string;
  workHistory: string;
  workDays: string;
  photoUrl: string;
  active: boolean;
  order: number;
};

/** Distinct filter values from active doctor profiles on a site. */
export type DoctorProfileFacetsDto = {
  specialities: string[];
  states: string[];
  citiesByState: Record<string, string[]>;
};

export type DoctorProfileRecord = {
  id: string;
  siteId: string;
  name: string;
  specializations: string[];
  about: string;
  experienceYears: number;
  state: string;
  city: string;
  phone: string;
  email: string;
  location: string;
  education: string;
  degree: string;
  workHistory: string;
  workDays: string;
  photoUrl: string;
  photoPublicId: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

export type DoctorProfileWrite = {
  name: string;
  specializations: string[];
  about: string;
  experienceYears: number;
  state: string;
  city: string;
  phone: string;
  email: string;
  location: string;
  education: string;
  degree: string;
  workHistory: string;
  workDays: string;
  photoUrl: string;
  photoPublicId: string;
  active: boolean;
  order: number;
};
