export type SiteCodeDto = 'IN' | 'COM';

export type CompanyImageRefDto = {
  url: string;
  publicId: string;
};

export type CompanyBasicInfoDto = {
  id: string | null;
  siteCode: SiteCodeDto;
  companyName: string;
  companyDomainName: string;
  contactNumbers: string[];
  whatsappNumber: string;
  mainLogo: CompanyImageRefDto;
  footerLogo: CompanyImageRefDto;
  mobileUiLogo: CompanyImageRefDto;
  emails: string[];
  officeAddresses: string[];
  googleAddress: string;
  googleUrl: string;
  googleLink: string;
  facebookLink: string;
  instagramLink: string;
  youtubeLink: string;
  googleMapLink: string;
  googleTrackingTag: string;
  titleTagForMainLandingPage: string;
  keywords: string[];
  updatedAt: string | null;
};

export type CompanyBasicInfoRecord = {
  id: string;
  siteId: string;
  companyName: string;
  companyDomainName: string;
  contactNumbers: string[];
  whatsappNumber: string;
  mainLogoUrl: string;
  mainLogoPublicId: string;
  footerLogoUrl: string;
  footerLogoPublicId: string;
  mobileUiLogoUrl: string;
  mobileUiLogoPublicId: string;
  emails: string[];
  officeAddresses: string[];
  googleAddress: string;
  googleUrl: string;
  googleLink: string;
  facebookLink: string;
  instagramLink: string;
  youtubeLink: string;
  googleMapLink: string;
  googleTrackingTag: string;
  titleTagForMainLandingPage: string;
  keywords: string[];
  updatedAt: Date;
};

export type CompanyBasicInfoUpsertData = Omit<
  CompanyBasicInfoRecord,
  'id' | 'siteId' | 'updatedAt'
>;
