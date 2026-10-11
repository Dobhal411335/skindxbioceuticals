import {
  companyBasicInfoBodySchema,
  normalizeCompanyBasicInfoInput,
} from '../company-basic-info.validation';

describe('company-basic-info validation', () => {
  it('normalizes phones and maps key to publicId', () => {
    const normalized = normalizeCompanyBasicInfoInput({
      companyName: '  Acme  ',
      companyDomainName: ' acme.com ',
      contactNumbers: ['98765-43210', ''],
      whatsappNumber: '9876543210',
      mainLogo: { url: 'https://cdn.example.com/a.png', key: 'folder/a' },
      emails: ['  a@b.com ', ''],
      keywords: [' one ', ''],
    });

    expect(normalized).toMatchObject({
      companyName: 'Acme',
      companyDomainName: 'acme.com',
      contactNumbers: ['9876543210'],
      whatsappNumber: '9876543210',
      mainLogo: { url: 'https://cdn.example.com/a.png', publicId: 'folder/a' },
      emails: ['a@b.com'],
      keywords: ['one'],
    });
  });

  it('accepts a valid payload', () => {
    const result = companyBasicInfoBodySchema.safeParse(
      normalizeCompanyBasicInfoInput({
        companyName: 'Acme',
        companyDomainName: 'acme.com',
        contactNumbers: ['9876543210'],
        whatsappNumber: '',
        emails: ['hello@acme.com'],
      }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects short contact numbers', () => {
    const result = companyBasicInfoBodySchema.safeParse(
      normalizeCompanyBasicInfoInput({
        companyName: 'Acme',
        companyDomainName: 'acme.com',
        contactNumbers: ['12345'],
      }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects missing company name', () => {
    const result = companyBasicInfoBodySchema.safeParse(
      normalizeCompanyBasicInfoInput({
        companyName: '   ',
        companyDomainName: 'acme.com',
      }),
    );
    expect(result.success).toBe(false);
  });
});
