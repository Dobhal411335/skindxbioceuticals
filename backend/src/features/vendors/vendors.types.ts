import type { Prisma, VendorApplicationStatus } from '@prisma/client';
import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

export type VendorDocumentRef = {
  url: string;
  publicId: string;
};

export type VendorApplicationRecord = Prisma.VendorApplicationGetPayload<object>;

export type VendorApplicationListItemDto = {
  id: string;
  siteCode: SiteCodeDto;
  businessName: string;
  contactPerson: string;
  mobile: string;
  email: string;
  gstNumber: string | null;
  status: VendorApplicationStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type VendorApplicationDetailDto = VendorApplicationListItemDto & {
  businessType: string;
  industryCategory: string;
  yearOfEstablishment: string;
  legalStructure: string;
  isGstRegistered: boolean;
  panNumber: string;
  msmeNumber: string | null;
  gstCertificate: VendorDocumentRef | null;
  panCard: VendorDocumentRef | null;
  msmeCertificate: VendorDocumentRef | null;
  cancelledCheque: VendorDocumentRef | null;
  productCatalog: VendorDocumentRef | null;
  businessCard: VendorDocumentRef | null;
  aadhaarUpload: VendorDocumentRef | null;
  authorizedPersonPhoto: VendorDocumentRef | null;
  designation: string;
  alternateMobile: string | null;
  whatsappNumber: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  deliveryCapability: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  qualityCertifications: string | null;
  returnPolicy: string | null;
  aadhaarNumber: string | null;
  referredBy: string | null;
  additionalNotes: string | null;
  notes: string | null;
  username: string | null;
  userId: string | null;
};

export type VendorCredentialDto = {
  id: string;
  siteCode: SiteCodeDto;
  businessName: string;
  contactPerson: string;
  email: string;
  mobile: string;
  username: string;
  passwordPlain: string;
  isActive: boolean;
  status: VendorApplicationStatus;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
};

/** One-time plaintext credentials returned only from approve / regenerate. */
export type VendorGeneratedCredentialsDto = {
  username: string;
  password: string;
  email: string;
};

export type VendorApplicationStatusPatchResultDto = {
  application: VendorApplicationDetailDto;
  credentials: VendorGeneratedCredentialsDto | null;
  emailSent: boolean;
};

export type VendorCredentialMutateResultDto = {
  credential: VendorCredentialDto;
  emailSent: boolean;
};

export type VendorDocumentUploadDto = {
  url: string;
  publicId: string;
};
