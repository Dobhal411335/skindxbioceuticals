import { apiClient } from "@/services/api/axios";
import { API_ENDPOINTS } from "@/services/api/endpoints";

const STOREFRONT_SITE_CODE = "IN" as const;

type Envelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type VendorDocumentRef = {
  url: string;
  publicId: string;
};

export type VendorApplicationPayload = {
  businessName: string;
  businessType: string;
  industryCategory: string;
  yearOfEstablishment: string;
  legalStructure: string;
  isGstRegistered: boolean;
  gstNumber?: string | null;
  panNumber: string;
  msmeNumber?: string | null;
  gstCertificate?: VendorDocumentRef | null;
  panCard: VendorDocumentRef;
  msmeCertificate?: VendorDocumentRef | null;
  cancelledCheque: VendorDocumentRef;
  productCatalog: VendorDocumentRef;
  businessCard?: VendorDocumentRef | null;
  aadhaarUpload?: VendorDocumentRef | null;
  authorizedPersonPhoto: VendorDocumentRef;
  contactPerson: string;
  designation: string;
  mobile: string;
  alternateMobile?: string | null;
  email: string;
  whatsappNumber?: string | null;
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
  qualityCertifications?: string | null;
  returnPolicy: string;
  aadhaarNumber?: string | null;
  referredBy?: string | null;
  additionalNotes?: string | null;
  website?: string;
};

export const vendorService = {
  async uploadDocument(file: File): Promise<VendorDocumentRef> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<Envelope<VendorDocumentRef>>(
      API_ENDPOINTS.VENDORS.DOCUMENTS(STOREFRONT_SITE_CODE),
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data;
  },

  async submitApplication(payload: VendorApplicationPayload): Promise<void> {
    await apiClient.post(
      API_ENDPOINTS.VENDORS.APPLICATIONS(STOREFRONT_SITE_CODE),
      payload,
    );
  },
};
