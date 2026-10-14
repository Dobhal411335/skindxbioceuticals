export type DoctorProfileDto = {
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
  createdAt: string;
  updatedAt: string;
};

export type DoctorProfileFormValues = {
  name: string;
  specialization: string;
  about: string;
  experienceYears: string;
  state: string;
  city: string;
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
  state: string;
  city: string;
  photoUrl: string;
  photoPublicId: string;
  active: boolean;
  order?: number;
};
