export const ENQUIRY_STATUSES = [
  "NEW",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export type EnquirySource =
  | "WEBSITE_IN"
  | "WEBSITE_COM"
  | "ADMIN"
  | "OTHER";

export type EnquiryDto = {
  id: string;
  siteCode: "IN" | "COM";
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: EnquirySource;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
};

export type EnquiryListParams = {
  name?: string;
  email?: string;
  phone?: string;
  from?: string;
  to?: string;
  status?: EnquiryStatus;
};

export type EnquiryStatusPatch = {
  status: EnquiryStatus;
};
