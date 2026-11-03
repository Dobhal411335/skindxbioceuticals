import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

export type EnquiryStatusValue = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type EnquirySourceValue = 'WEBSITE_IN' | 'WEBSITE_COM' | 'ADMIN' | 'OTHER';

export const ENQUIRY_STATUSES = [
  'NEW',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
] as const satisfies readonly EnquiryStatusValue[];

export type EnquiryDto = {
  id: string;
  siteCode: SiteCodeDto;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: EnquirySourceValue;
  status: EnquiryStatusValue;
  createdAt: string;
  updatedAt: string;
};

export type EnquiryRecord = {
  id: string;
  siteId: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: EnquirySourceValue;
  status: EnquiryStatusValue;
  createdAt: Date;
  updatedAt: Date;
};

export type EnquiryWrite = {
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: EnquirySourceValue;
};

export type EnquiryListFilters = {
  name?: string;
  email?: string;
  phone?: string;
  from?: Date;
  to?: Date;
  status?: EnquiryStatusValue;
};
