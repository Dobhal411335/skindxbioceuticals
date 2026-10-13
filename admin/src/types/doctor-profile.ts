export type DoctorConsultancyType = "BY_APPOINTMENT" | "ONLINE";

export type DoctorProfileDto = {
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
  createdAt: string;
  updatedAt: string;
};

export type DoctorProfileFormValues = {
  name: string;
  specialization: string;
  about: string;
  experienceYears: string;
  consultancyType: DoctorConsultancyType;
  photoUrl: string;
  photoPublicId: string;
  active: boolean;
  order: string;
};

export type DoctorProfilePayload = {
  name: string;
  specialization: string;
  about: string;
  experienceYears: number;
  consultancyType: DoctorConsultancyType;
  photoUrl: string;
  photoPublicId: string;
  active: boolean;
  order?: number;
};
