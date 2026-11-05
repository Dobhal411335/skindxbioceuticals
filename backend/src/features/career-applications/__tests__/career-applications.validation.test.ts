import { assertResumeFile, careerApplicationCreateBodySchema } from '../career-applications.validation';
import { ValidationError } from '@/utils/AppError';

const validBody = {
  firstName: 'Ada',
  middleName: '',
  lastName: 'Lovelace',
  birthMonth: '5',
  birthDay: '15',
  birthYear: '1990',
  streetAddress: '122 Bhogal Road',
  streetAddressLine2: '',
  city: 'Delhi',
  state: 'Delhi',
  postalCode: '110014',
  email: 'ada@example.com',
  phone: '+91 9876543210',
  linkedIn: 'https://www.linkedin.com/in/ada',
  positionApplied: 'Research',
  heardAbout: 'LinkedIn',
  availableStartDate: '2099-01-15',
  companyWebsite: '',
};

describe('career application validation', () => {
  it('accepts a complete application', () => {
    const parsed = careerApplicationCreateBodySchema.parse(validBody);
    expect(parsed.birthMonth).toBe(5);
    expect(parsed.email).toBe('ada@example.com');
    expect(parsed.availableStartDate.toISOString().slice(0, 10)).toBe('2099-01-15');
  });

  it('rejects an impossible birth date and a past start date', () => {
    const birth = careerApplicationCreateBodySchema.safeParse({
      ...validBody,
      birthMonth: '2',
      birthDay: '31',
    });
    expect(birth.success).toBe(false);

    const start = careerApplicationCreateBodySchema.safeParse({
      ...validBody,
      availableStartDate: '2000-01-01',
    });
    expect(start.success).toBe(false);
  });

  it('allows only pdf, doc, and docx resumes up to 5 MB', () => {
    expect(() =>
      assertResumeFile({
        originalname: 'cv.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      } as Express.Multer.File),
    ).not.toThrow();

    const word = {
      originalname: 'cv.docx',
      mimetype: 'application/octet-stream',
      size: 1024,
    } as Express.Multer.File;
    expect(() => assertResumeFile(word)).not.toThrow();
    expect(word.mimetype).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );

    expect(() =>
      assertResumeFile({
        originalname: 'cv.png',
        mimetype: 'image/png',
        size: 1024,
      } as Express.Multer.File),
    ).toThrow(ValidationError);

    expect(() =>
      assertResumeFile({
        originalname: 'cv.pdf',
        mimetype: 'application/pdf',
        size: 5 * 1024 * 1024 + 1,
      } as Express.Multer.File),
    ).toThrow(/5 MB/);
  });
});
