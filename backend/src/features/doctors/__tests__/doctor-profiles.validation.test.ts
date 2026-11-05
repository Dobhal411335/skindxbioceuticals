import {
  doctorProfileBodySchema,
  normalizeDoctorProfileInput,
} from '../doctor-profiles.validation';

describe('doctor-profiles validation', () => {
  it('normalizes name to Dr. prefix via schema transform', () => {
    const result = doctorProfileBodySchema.safeParse({
      name: 'daisy bins',
      specializations: ['Dermatology', 'dermatology', 'Cosmetology'],
      about: 'Clinician bio',
      experienceYears: 10,
      state: 'Maharashtra',
      city: 'Mumbai',
      phone: '9876543210',
      email: 'Daisy@Example.com',
      location: 'Bandra West, Mumbai',
      photoUrl: 'https://cdn.example.com/doc.jpg',
      photoPublicId: 'doctors/doc',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Dr. daisy bins');
      expect(result.data.specializations).toEqual(['Dermatology', 'Cosmetology']);
      expect(result.data.phone).toBe('+91 9876543210');
      expect(result.data.email).toBe('daisy@example.com');
      expect(result.data.state).toBe('Maharashtra');
      expect(result.data.city).toBe('Mumbai');
    }
  });

  it('rejects invalid Indian state', () => {
    const result = doctorProfileBodySchema.safeParse({
      name: 'Daisy',
      specializations: ['Dermatology'],
      about: 'Clinician bio',
      phone: '9876543210',
      email: 'daisy@example.com',
      location: 'Mumbai',
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
      phone: ' 98765 43210 ',
      email: ' Pat@Example.com ',
      location: ' Clinic ',
      experienceYears: '5',
      state: ' Delhi ',
      city: ' New Delhi ',
      photo: { secureUrl: 'https://cdn.example.com/a.jpg', publicId: 'doctors/a' },
    }) as Record<string, unknown>;

    expect(normalized.photoUrl).toBe('https://cdn.example.com/a.jpg');
    expect(normalized.photoPublicId).toBe('doctors/a');
    expect(normalized.specializations).toEqual(['Derm']);
    expect(normalized.phone).toBe('98765 43210');
    expect(normalized.email).toBe('pat@example.com');
    expect(normalized.state).toBe('Delhi');
    expect(normalized.city).toBe('New Delhi');
    expect(normalized.location).toBe('Clinic');
  });
});
