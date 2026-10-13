import {
  doctorPageConfigBodySchema,
  normalizeDoctorPageConfigInput,
} from '../doctor-page.validation';

describe('doctor-page validation', () => {
  it('accepts a valid manage-page payload', () => {
    const result = doctorPageConfigBodySchema.safeParse({
      aboutHeading: 'Complete Medical Solutions',
      aboutDescription: 'Trusted clinical care.',
      aboutHighlights: ['Positive Feedback', 'Expert Doctors'],
      aboutButtonLabel: 'About More',
      aboutButtonUrl: '/about',
      aboutImageUrl: 'https://cdn.example.com/about.jpg',
      aboutImagePublicId: 'doctors/about',
      experienceYears: 20,
      servicesHeading: 'High Quality Services for You',
      servicesSubheading: 'Care tailored to your needs.',
      services: [
        {
          iconKey: 'Stethoscope',
          name: 'Skin Care',
          description: 'Clinical dermatology support.',
          readMoreUrl: '/services/skin',
          active: true,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects unknown service icon keys', () => {
    const result = doctorPageConfigBodySchema.safeParse({
      services: [
        {
          iconKey: 'NotARealIcon',
          name: 'Care',
          description: 'Desc',
          readMoreUrl: '',
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('normalizes nested media secureUrl shapes', () => {
    const normalized = normalizeDoctorPageConfigInput({
      heading: 'About',
      description: 'Desc',
      highlights: ['A'],
      buttonLabel: 'More',
      buttonUrl: '/x',
      aboutImage: {
        secureUrl: 'https://cdn.example.com/a.jpg',
        publicId: 'doctors/a',
      },
      services: [
        {
          icon: 'HeartPulse',
          name: 'Heart',
          description: 'Care',
          url: '/heart',
        },
      ],
    }) as Record<string, unknown>;

    expect(normalized.aboutHeading).toBe('About');
    expect(normalized.aboutImageUrl).toBe('https://cdn.example.com/a.jpg');
    expect(normalized.aboutImagePublicId).toBe('doctors/a');
    expect(normalized.aboutHighlights).toEqual(['A']);
    expect(normalized.services).toEqual([
      {
        iconKey: 'HeartPulse',
        name: 'Heart',
        description: 'Care',
        readMoreUrl: '/heart',
        order: undefined,
        active: true,
      },
    ]);
  });
});
