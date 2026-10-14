export type DoctorProfile = {
  id: string;
  siteCode: "IN" | "COM";
  name: string;
  specialization: string;
  about: string;
  experienceYears: number;
  state: string;
  city: string;
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

export type DoctorAppointmentCreatePayload = {
  doctorId: string;
  patientName: string;
  email: string;
  scheduledAt: string;
  problem: string;
  website?: string;
};
