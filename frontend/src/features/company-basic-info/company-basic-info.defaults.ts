import type { CompanyBasicInfo } from "@/types/company-basic-info";

const emptyImage = { url: "", publicId: "" };

/** Fallback when the API is unavailable — never invent medical claims. */
export const FALLBACK_COMPANY_BASIC_INFO: CompanyBasicInfo = {
  id: null,
  siteCode: "IN",
  companyName: "SkinDx Bioceuticals",
  companyDomainName: "",
  contactNumbers: [],
  whatsappNumber: "",
  mainLogo: emptyImage,
  footerLogo: emptyImage,
  mobileUiLogo: emptyImage,
  emails: [],
  officeAddresses: [],
  googleAddress: "",
  googleUrl: "",
  googleLink: "",
  facebookLink: "",
  instagramLink: "",
  youtubeLink: "",
  googleMapLink: "",
  googleTrackingTag: "",
  titleTagForMainLandingPage: "SkinDX Bioceuticals",
  keywords: [],
  updatedAt: null,
};
