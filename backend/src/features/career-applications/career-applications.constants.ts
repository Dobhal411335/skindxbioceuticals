export const CAREER_POSITIONS = [
  'Sales',
  'Marketing',
  'Research',
  'Quality control',
  'Operations',
  'Customer support',
  'Other',
] as const;

export const CAREER_HEARD_ABOUT = [
  'Company website',
  'LinkedIn',
  'Employee referral',
  'Job portal',
  'Social media',
  'Other',
] as const;

export const CAREER_APPLICATION_STATUSES = [
  'PENDING',
  'IN_REVIEW',
  'SHORTLISTED',
  'REJECTED',
  'HIRED',
] as const;

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

export const RESUME_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export type CareerPosition = (typeof CAREER_POSITIONS)[number];
export type CareerHeardAbout = (typeof CAREER_HEARD_ABOUT)[number];
export type CareerApplicationStatusValue = (typeof CAREER_APPLICATION_STATUSES)[number];
