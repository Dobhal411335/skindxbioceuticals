import {
  enquiryCreateBodySchema,
  enquiryListQuerySchema,
  normalizeEnquiryCreateInput,
} from '../enquiry.validation';

describe('enquiryCreateBodySchema', () => {
  it('accepts a valid contact enquiry payload', () => {
    const parsed = enquiryCreateBodySchema.parse({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+91 9876543210',
      message: 'Need help with an order',
    });
    expect(parsed.name).toBe('Ada Lovelace');
    expect(parsed.email).toBe('ada@example.com');
  });

  it('rejects missing description', () => {
    expect(() =>
      enquiryCreateBodySchema.parse({
        name: 'Ada',
        email: 'ada@example.com',
        phone: '+91 9876543210',
        message: '',
      }),
    ).toThrow();
  });
});

describe('normalizeEnquiryCreateInput', () => {
  it('maps description alias and lowercases email', () => {
    const normalized = normalizeEnquiryCreateInput({
      name: ' Ada ',
      email: 'Ada@Example.COM',
      phoneNumber: '9876543210',
      description: ' Hello ',
    }) as Record<string, unknown>;

    expect(normalized.name).toBe('Ada');
    expect(normalized.email).toBe('ada@example.com');
    expect(normalized.phone).toBe('9876543210');
    expect(normalized.message).toBe('Hello');
  });
});

describe('enquiryListQuerySchema', () => {
  it('parses name/email/phone/date filters', () => {
    const parsed = enquiryListQuerySchema.parse({
      name: 'Ada',
      email: 'ada@',
      phone: '9876',
      from: '2026-11-01T00:00:00.000Z',
      to: '2026-11-03T23:59:59.999Z',
    });
    expect(parsed.name).toBe('Ada');
    expect(parsed.email).toBe('ada@');
    expect(parsed.phone).toBe('9876');
    expect(parsed.from).toBeInstanceOf(Date);
    expect(parsed.to).toBeInstanceOf(Date);
  });
});
