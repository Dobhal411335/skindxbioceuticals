export const CAREER_APPLICATION_STATUSES = [
  "PENDING",
  "IN_REVIEW",
  "SHORTLISTED",
  "REJECTED",
  "HIRED",
] as const;

export type CareerApplicationStatus = (typeof CAREER_APPLICATION_STATUSES)[number];

export type CareerApplicationDto = {
  id: string;
  siteCode: "IN" | "COM";
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
  status: CareerApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type CareerApplicationListParams = {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  status?: CareerApplicationStatus;
  from?: string;
  to?: string;
};

export type CareerResumeAccess = {
  url: string;
  fileName: string;
  mimeType: string;
};
