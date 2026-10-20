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

const DOCTOR_PREFIX_PATTERN =
  /^(Prof\.\s*Dr\.?|Prof\s+Dr\.?|Assoc\.\s*Prof\.?|Assoc\s+Prof\.?|Prof\.?|Surgeon|MD\.?|Dr\.?)\s+/i;

/**
 * Store display names with doctor prefix (e.g. `Dr. {name}`, `MD {name}`, `Prof. {name}`),
 * normalizing any irregular prefix casings and defaulting to `Dr.` if omitted.
 */
export function normalizeDoctorName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  const match = trimmed.match(DOCTOR_PREFIX_PATTERN);

  if (match) {
    const rawPrefix = match[1] ?? '';
    const remainder = trimmed.slice(match[0].length).trim();
    if (/^Prof\s*\.?\s*Dr/i.test(rawPrefix)) {
      return `Prof. Dr. ${remainder}`;
    }
    if (/^Assoc\s*\.?\s*Prof/i.test(rawPrefix)) {
      return `Assoc. Prof. ${remainder}`;
    }
    if (/^Prof/i.test(rawPrefix)) {
      return `Prof. ${remainder}`;
    }
    if (/^Surgeon/i.test(rawPrefix)) {
      return `Surgeon ${remainder}`;
    }
    if (/^MD/i.test(rawPrefix)) {
      return `MD ${remainder}`;
    }
    if (/^Dr/i.test(rawPrefix)) {
      return `Dr. ${remainder}`;
    }
  }

  const withoutPrefix = trimmed.replace(/^(dr\.?)\s+/i, '').replace(/^(dr\.?)$/i, '');
  const name = withoutPrefix.trim() || trimmed;
  return `Dr. ${name}`;
}
