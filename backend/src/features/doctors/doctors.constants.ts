/** Curated Lucide icon names allowed for doctor page service cards. */
export const DOCTOR_SERVICE_ICON_KEYS = [
  'Stethoscope',
  'HeartPulse',
  'Ambulance',
  'FlaskConical',
  'Eye',
  'LayoutGrid',
  'Bone',
  'Brain',
  'Baby',
  'Pill',
  'Activity',
  'Syringe',
  'Hospital',
  'Microscope',
  'Thermometer',
  'Scan',
] as const;

export type DoctorServiceIconKey = (typeof DOCTOR_SERVICE_ICON_KEYS)[number];

/**
 * Store display names as `Dr. {name}`, normalizing if the user already typed a Dr. prefix.
 */
export function normalizeDoctorName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  const withoutPrefix = trimmed.replace(/^(dr\.?)\s+/i, '').replace(/^(dr\.?)$/i, '');
  const name = withoutPrefix.trim() || trimmed;
  return `Dr. ${name}`;
}
