export type DoctorConsultancyType = "BY_APPOINTMENT" | "ONLINE";

export type DoctorProfile = {
  id: string;
  siteCode: "IN" | "COM";
  name: string;
  specialization: string;
  about: string;
  experienceYears: number;
  consultancyType: DoctorConsultancyType;
  photoUrl: string;
  photoPublicId: string;
  active: boolean;
  order: number;
};

export type DoctorServiceItem = {
  id: string;
  iconKey: string;
  name: string;
  description: string;
  readMoreUrl: string;
  order: number;
  active: boolean;
};

export type DoctorPageConfig = {
  id: string | null;
  siteCode: "IN" | "COM";
  aboutHeading: string;
  aboutDescription: string;
  aboutHighlights: string[];
  aboutButtonLabel: string;
  aboutButtonUrl: string;
  aboutImageUrl: string;
  aboutImagePublicId: string;
  aboutSecondaryImageUrl: string;
  aboutSecondaryImagePublicId: string;
  experienceYears: number | null;
  servicesHeading: string;
  servicesSubheading: string;
  services: DoctorServiceItem[];
};
