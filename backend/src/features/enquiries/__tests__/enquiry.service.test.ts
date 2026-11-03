import { EnquiryService, toEnquiryDto } from '../enquiry.service';
import type { EnquiryRepository } from '../enquiry.repository';
import type { EnquiryRecord } from '../enquiry.types';

function makeRecord(overrides: Partial<EnquiryRecord> = {}): EnquiryRecord {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    siteId: '22222222-2222-2222-2222-222222222222',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '+91 9876543210',
    subject: 'Contact Us',
    message: 'Looking for product details',
    source: 'WEBSITE_IN',
    status: 'NEW',
    createdAt: new Date('2026-11-03T10:00:00.000Z'),
    updatedAt: new Date('2026-11-03T10:00:00.000Z'),
    ...overrides,
  };
}

describe('EnquiryService', () => {
  const create = jest.fn();
  const listBySiteId = jest.fn();
  const findByIdForSite = jest.fn();
  const updateStatusForSite = jest.fn();
  const sendEnquiryConfirmationEmail = jest.fn().mockResolvedValue({ ok: true });

  const repository = {
    create,
    listBySiteId,
    findByIdForSite,
    updateStatusForSite,
  } as unknown as EnquiryRepository;

  const mail = {
    sendEnquiryConfirmationEmail,
  };

  const service = new EnquiryService(repository, mail as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps enquiry records to DTOs', () => {
    const row = makeRecord();
    expect(toEnquiryDto(row, 'IN')).toEqual({
      id: row.id,
      siteCode: 'IN',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+91 9876543210',
      subject: 'Contact Us',
      message: 'Looking for product details',
      source: 'WEBSITE_IN',
      status: 'NEW',
      createdAt: '2026-11-03T10:00:00.000Z',
      updatedAt: '2026-11-03T10:00:00.000Z',
    });
  });

  it('returns null for honeypot submissions without persisting', async () => {
    const result = await service.createPublic({
      siteId: 'site-1',
      siteCode: 'IN',
      body: {
        name: 'Bot',
        email: 'bot@example.com',
        phone: '+91 9000000000',
        message: 'spam',
        website: 'http://spam.test',
      },
    });

    expect(result).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it('creates a contact enquiry and sends confirmation email', async () => {
    const row = makeRecord();
    create.mockResolvedValue(row);

    const result = await service.createPublic({
      siteId: row.siteId,
      siteCode: 'IN',
      body: {
        name: row.name,
        email: row.email,
        phone: row.phone!,
        message: row.message,
      },
    });

    expect(create).toHaveBeenCalledWith(
      row.siteId,
      expect.objectContaining({
        name: row.name,
        email: row.email,
        phone: row.phone,
        subject: 'Contact Us',
        source: 'WEBSITE_IN',
      }),
    );
    expect(result?.id).toBe(row.id);
    expect(sendEnquiryConfirmationEmail).toHaveBeenCalled();
  });

  it('lists enquiries with filters', async () => {
    const row = makeRecord();
    listBySiteId.mockResolvedValue([row]);

    const result = await service.listForSite(row.siteId, 'IN', {
      name: 'Ada',
      email: 'ada',
      phone: '9876',
      from: new Date('2026-11-01T00:00:00.000Z'),
      to: new Date('2026-11-03T23:59:59.999Z'),
    });

    expect(listBySiteId).toHaveBeenCalledWith(
      row.siteId,
      expect.objectContaining({
        name: 'Ada',
        email: 'ada',
        phone: '9876',
      }),
    );
    expect(result).toHaveLength(1);
  });

  it('patches enquiry status', async () => {
    const row = makeRecord({ status: 'IN_PROGRESS' });
    updateStatusForSite.mockResolvedValue(row);

    const result = await service.patchForSite(row.siteId, 'IN', row.id, {
      status: 'IN_PROGRESS',
    });

    expect(updateStatusForSite).toHaveBeenCalledWith(
      row.siteId,
      row.id,
      'IN_PROGRESS',
    );
    expect(result.status).toBe('IN_PROGRESS');
  });
});
