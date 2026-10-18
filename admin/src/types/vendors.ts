export type VendorApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type VendorDocumentRef = {
  url: string;
  publicId: string;
};

export type VendorApplicationListItem = {
  id: string;
  siteCode: "IN" | "COM";
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

export type VendorApplicationDetail = VendorApplicationListItem & {
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

export type VendorCredential = {
  id: string;
  siteCode: "IN" | "COM";
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

export type VendorGeneratedCredentials = {
  username: string;
  password: string;
  email: string;
};

export type VendorApplicationStatusPatchResult = {
  application: VendorApplicationDetail;
  credentials: VendorGeneratedCredentials | null;
  emailSent: boolean;
};

export type VendorCredentialMutateResult = {
  credential: VendorCredential;
  emailSent: boolean;
};
