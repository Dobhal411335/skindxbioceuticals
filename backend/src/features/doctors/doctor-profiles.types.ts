import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

export type DoctorProfileDto = {
  id: string;
  siteCode: SiteCodeDto;
  name: string;
  specialization: string;
  about: string;
  experienceYears: number;
  state: string;
  city: string;
  photoUrl: string;
  photoPublicId: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type DoctorProfileRecord = {
  id: string;
  siteId: string;
  name: string;
  specialization: string;
  about: string;
  experienceYears: number;
  state: string;
  city: string;
  photoUrl: string;
  photoPublicId: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

export type DoctorProfileWrite = {
  name: string;
  specialization: string;
  about: string;
  experienceYears: number;
  state: string;
  city: string;
  photoUrl: string;
  photoPublicId: string;
  active: boolean;
  order: number;
};
