import type {
  DoctorProfileFormValues,
  DoctorProfilePayload,
} from "@/types/doctor-profile";

export type DoctorProfileFormErrors = Partial<
  Record<keyof DoctorProfileFormValues, string>
>;

function stripDoctorPrefix(name: string): string {
  return name.trim().replace(/^(dr\.?)\s+/i, "").trim();
}

export function validateDoctorProfileForm(
  values: DoctorProfileFormValues,
):
  | { success: true; data: DoctorProfileFormValues }
  | { success: false; errors: DoctorProfileFormErrors } {
  const errors: DoctorProfileFormErrors = {};
  const name = stripDoctorPrefix(values.name);
  if (!name) errors.name = "Doctor name is required";
  if (!values.specialization.trim()) {
    errors.specialization = "Specialization is required";
  }
  if (!values.about.trim()) errors.about = "About is required";

  const experienceYears = Number(values.experienceYears);
  if (
    values.experienceYears.trim() === "" ||
    !Number.isInteger(experienceYears) ||
    experienceYears < 0 ||
    experienceYears > 80
  ) {
    errors.experienceYears = "Enter experience years between 0 and 80";
  }

  if (!values.consultancyType) {
    errors.consultancyType = "Consultancy type is required";
  }

  if (!values.photoUrl.trim()) {
    errors.photoUrl = "Doctor photo is required";
  }

  if (values.order.trim() !== "") {
    const order = Number(values.order);
    if (!Number.isInteger(order) || order < 0) {
      errors.order = "Order must be a non-negative integer";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      ...values,
      name,
      specialization: values.specialization.trim(),
      about: values.about.trim(),
    },
  };
}

export function toDoctorProfilePayload(
  values: DoctorProfileFormValues,
  fallbackOrder: number,
): DoctorProfilePayload {
  return {
    name: values.name,
    specialization: values.specialization.trim(),
    about: values.about.trim(),
    experienceYears: Number(values.experienceYears),
    consultancyType: values.consultancyType,
    photoUrl: values.photoUrl.trim(),
    photoPublicId: values.photoPublicId.trim(),
    active: values.active,
    order:
      values.order.trim() === "" ? fallbackOrder : Number(values.order),
  };
}
