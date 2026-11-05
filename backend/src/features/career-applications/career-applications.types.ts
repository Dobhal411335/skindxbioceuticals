import type { CareerApplicationStatusValue } from './career-applications.constants';
import type { CareerApplicationCreateBody } from './career-applications.validation';

export type CareerApplicationRecord = {
  id: string;
  siteId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  birthMonth: number;
  birthDay: number;
  birthYear: number;
  streetAddress: string;
  streetAddressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  email: string;
  phone: string;
  linkedIn: string;
  positionApplied: string;
  heardAbout: string;
  availableStartDate: Date;
  resumeUrl: string;
  resumePublicId: string;
  resumeFileName: string;
  resumeMimeType: string;
  status: CareerApplicationStatusValue;
  createdAt: Date;
  updatedAt: Date;
};

export type CareerApplicationDto = {
  id: string;
  siteCode: 'IN' | 'COM';
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  birthMonth: number;
  birthDay: number;
  birthYear: number;
  streetAddress: string;
  streetAddressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  email: string;
  phone: string;
  linkedIn: string;
  positionApplied: string;
  heardAbout: string;
  availableStartDate: string;
  resumeFileName: string;
  resumeMimeType: string;
  status: CareerApplicationStatusValue;
  createdAt: string;
  updatedAt: string;
};

export type CareerApplicationWrite = Omit<
  CareerApplicationCreateBody,
  'companyWebsite' | 'availableStartDate'
> & {
  availableStartDate: Date;
  resumeUrl: string;
  resumePublicId: string;
  resumeFileName: string;
  resumeMimeType: string;
};

export type CareerResumeAccess = {
  url: string;
  fileName: string;
  mimeType: string;
};
