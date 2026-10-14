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
      state: 'Maharashtra',
      city: 'Mumbai',
      photoUrl: 'https://cdn.example.com/doc.jpg',
      photoPublicId: 'doctors/doc',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Dr. daisy bins');
      expect(result.data.state).toBe('Maharashtra');
      expect(result.data.city).toBe('Mumbai');
    }
  });

  it('rejects invalid Indian state', () => {
    const result = doctorProfileBodySchema.safeParse({
      name: 'Daisy',
      specialization: 'Dermatology',
      about: 'Clinician bio',
      experienceYears: 10,
      state: 'California',
      city: 'Los Angeles',
      photoUrl: 'https://cdn.example.com/doc.jpg',
      photoPublicId: 'doctors/doc',
    });

    expect(result.success).toBe(false);
  });

  it('accepts nested photo secureUrl shapes', () => {
    const normalized = normalizeDoctorProfileInput({
      name: 'Dr. Pat',
      specialization: 'Derm',
      about: 'Bio',
      experienceYears: '5',
      state: ' Delhi ',
      city: ' New Delhi ',
      photo: { secureUrl: 'https://cdn.example.com/a.jpg', publicId: 'doctors/a' },
    }) as Record<string, unknown>;

    expect(normalized.photoUrl).toBe('https://cdn.example.com/a.jpg');
    expect(normalized.photoPublicId).toBe('doctors/a');
    expect(normalized.state).toBe('Delhi');
    expect(normalized.city).toBe('New Delhi');
  });
});
