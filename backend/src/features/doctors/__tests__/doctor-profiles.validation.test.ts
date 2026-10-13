import {
  doctorProfileBodySchema,
  normalizeDoctorProfileInput,
} from '../doctor-profiles.validation';

describe('doctor-profiles validation', () => {
  it('normalizes name to Dr. prefix via schema transform', () => {
    const result = doctorProfileBodySchema.safeParse({
      name: 'daisy bins',
      specialization: 'Dermatology',
      about: 'Clinician bio',
      experienceYears: 10,
      consultancyType: 'ONLINE',
      photoUrl: 'https://cdn.example.com/doc.jpg',
      photoPublicId: 'doctors/doc',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Dr. daisy bins');
    }
  });

  it('accepts nested photo secureUrl shapes', () => {
    const normalized = normalizeDoctorProfileInput({
      name: 'Dr. Pat',
      specialization: 'Derm',
      about: 'Bio',
      experienceYears: '5',
      consultancyType: 'by-appointment',
      photo: { secureUrl: 'https://cdn.example.com/a.jpg', publicId: 'doctors/a' },
    }) as Record<string, unknown>;

    expect(normalized.photoUrl).toBe('https://cdn.example.com/a.jpg');
    expect(normalized.photoPublicId).toBe('doctors/a');
    expect(normalized.consultancyType).toBe('BY_APPOINTMENT');
  });
});
