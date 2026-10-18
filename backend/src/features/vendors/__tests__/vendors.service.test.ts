import { VendorsService } from '../vendors.service';
import type { VendorsRepository } from '../vendors.repository';
import type { VendorApplicationRecord } from '../vendors.types';
import { ConflictError, NotFoundError } from '@/utils/AppError';

jest.mock('@/lib/password', () => ({
  hashPassword: jest.fn(async (plain: string) => `hashed:${plain}`),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

function makeRecord(
  overrides: Partial<VendorApplicationRecord> = {},
): VendorApplicationRecord {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    siteId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    businessName: 'Acme Labs',
    businessType: 'Distributor',
    industryCategory: 'Skincare',
    yearOfEstablishment: '2018',
    legalStructure: 'Pvt Ltd',
    isGstRegistered: true,
    gstNumber: '22AAAAA0000A1Z5',
    panNumber: 'AAAAA0000A',
    msmeNumber: null,
    gstCertificate: null,
    panCard: { url: 'https://cdn.example/pan.pdf', publicId: 'pan' },
    msmeCertificate: null,
    cancelledCheque: { url: 'https://cdn.example/cheque.pdf', publicId: 'cheque' },
    productCatalog: { url: 'https://cdn.example/catalog.pdf', publicId: 'catalog' },
    businessCard: null,
    aadhaarUpload: null,
    authorizedPersonPhoto: { url: 'https://cdn.example/photo.jpg', publicId: 'photo' },
    contactPerson: 'Riya Sharma',
    designation: 'Owner',
    mobile: '9876543210',
    alternateMobile: null,
    email: 'riya@example.com',
    whatsappNumber: null,
    address: '12 Market Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India',
    deliveryCapability: 'Pan India',
    bankName: 'HDFC',
    accountHolderName: 'Riya Sharma',
    accountNumber: '1234567890',
    ifscCode: 'HDFC0001234',
    branch: 'Andheri',
    qualityCertifications: null,
    returnPolicy: '7 days',
    aadhaarNumber: null,
    referredBy: null,
    additionalNotes: null,
    notes: null,
    status: 'PENDING',
    isActive: false,
    username: null,
    passwordHash: null,
    passwordPlain: null,
    userId: null,
    createdAt: new Date('2026-10-18T08:00:00.000Z'),
    updatedAt: new Date('2026-10-18T08:00:00.000Z'),
    ...overrides,
  } as VendorApplicationRecord;
}

describe('VendorsService', () => {
  const findDuplicate = jest.fn();
  const create = jest.fn();
  const listBySite = jest.fn();
  const listCredentials = jest.fn();
  const findByIdForSite = jest.fn();
  const usernameExists = jest.fn();
  const findUserByEmail = jest.fn();
  const createVendorUser = jest.fn();
  const approveWithCredentials = jest.fn();
  const updateStatus = jest.fn();
  const updateUserStatus = jest.fn();
  const setActive = jest.fn();
  const regeneratePassword = jest.fn();

  const repository = {
    findDuplicate,
    create,
    listBySite,
    listCredentials,
    findByIdForSite,
    usernameExists,
    findUserByEmail,
    createVendorUser,
    approveWithCredentials,
    updateStatus,
    updateUserStatus,
    setActive,
    regeneratePassword,
  } as unknown as VendorsRepository;

  const sendVendorApprovedEmail = jest.fn().mockResolvedValue({ submitted: true });
  const mail = { sendVendorApprovedEmail };

  const service = new VendorsService(repository, mail as never);

  beforeEach(() => {
    jest.clearAllMocks();
    usernameExists.mockResolvedValue(false);
    findUserByEmail.mockResolvedValue(null);
  });

  it('creates a pending application', async () => {
    const record = makeRecord();
    findDuplicate.mockResolvedValue(null);
    create.mockResolvedValue(record);

    const dto = await service.createPublic({
      siteId: record.siteId,
      siteCode: 'IN',
      body: {
        ...record,
        website: '',
        returnPolicy: '7 days',
        panCard: { url: 'https://cdn.example/pan.pdf', publicId: 'pan' },
        cancelledCheque: { url: 'https://cdn.example/cheque.pdf', publicId: 'cheque' },
        productCatalog: { url: 'https://cdn.example/catalog.pdf', publicId: 'catalog' },
        authorizedPersonPhoto: { url: 'https://cdn.example/photo.jpg', publicId: 'photo' },
      } as never,
    });

    expect(create).toHaveBeenCalled();
    expect(dto?.status).toBe('PENDING');
    expect(dto?.businessName).toBe('Acme Labs');
  });

  it('rejects duplicate email or mobile', async () => {
    findDuplicate.mockResolvedValue({ id: 'x' });
    await expect(
      service.createPublic({
        siteId: 'site',
        siteCode: 'IN',
        body: { email: 'a@b.com', mobile: '9876543210', website: '' } as never,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('approves application, stores hash+plain, creates VENDOR user, emails credentials', async () => {
    const record = makeRecord();
    findByIdForSite.mockResolvedValue(record);
    createVendorUser.mockResolvedValue({
      id: 'user-1',
      role: 'VENDOR',
    });
    const approved = makeRecord({
      status: 'APPROVED',
      isActive: true,
      username: 'riyasharma001',
      passwordHash: 'hashed:secret',
      passwordPlain: 'secretPlain1',
      userId: 'user-1',
    });
    approveWithCredentials.mockResolvedValue(approved);

    const dto = await service.patchStatus(record.siteId, 'IN', record.id, {
      status: 'APPROVED',
    });

    expect(createVendorUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'riya@example.com',
        firstName: 'Riya Sharma',
      }),
    );
    expect(approveWithCredentials).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordHash: expect.stringMatching(/^hashed:/),
        passwordPlain: expect.any(String),
        userId: 'user-1',
      }),
    );
    const approveCall = approveWithCredentials.mock.calls[0]![0];
    expect(JSON.stringify(mail.sendVendorApprovedEmail.mock.calls)).not.toContain(
      approveCall.passwordHash,
    );
    expect(sendVendorApprovedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        username: expect.any(String),
        password: approveCall.passwordPlain,
      }),
    );
    expect(dto.application.status).toBe('APPROVED');
    expect(dto.application.username).toBeTruthy();
    expect(dto.emailSent).toBe(true);
    expect(dto.credentials).toEqual(
      expect.objectContaining({
        username: expect.any(String),
        password: approveCall.passwordPlain,
        email: 'riya@example.com',
      }),
    );
    // Plaintext is stored separately; login hash is a one-time bcrypt of that plain.
    expect(approveCall.passwordHash).toBe(`hashed:${approveCall.passwordPlain}`);
    expect(approveCall.passwordHash).not.toBe(approveCall.passwordPlain);
  });

  it('regenerates password with a single hash for User + application plain copy', async () => {
    const record = makeRecord({
      status: 'APPROVED',
      isActive: true,
      username: 'vendor1',
      passwordPlain: 'oldPlain',
      userId: 'user-1',
    });
    findByIdForSite.mockResolvedValue(record);
    regeneratePassword.mockImplementation(async (input) =>
      makeRecord({
        ...record,
        passwordHash: input.passwordHash,
        passwordPlain: input.passwordPlain,
      }),
    );

    const result = await service.regeneratePassword(record.siteId, 'IN', record.id);

    expect(regeneratePassword).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        passwordHash: expect.stringMatching(/^hashed:/),
        passwordPlain: expect.any(String),
      }),
    );
    const call = regeneratePassword.mock.calls[0]![0];
    expect(call.passwordHash).toBe(`hashed:${call.passwordPlain}`);
    expect(call.passwordPlain).not.toBe('oldPlain');
    expect(result.emailSent).toBe(true);
    expect(result.credential.passwordPlain).toBe(call.passwordPlain);
    expect(sendVendorApprovedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'vendor1',
        password: call.passwordPlain,
      }),
    );
  });

  it('toggles credential active flag', async () => {
    const record = makeRecord({
      status: 'APPROVED',
      isActive: true,
      username: 'vendor1',
      passwordPlain: 'plain',
      userId: 'user-1',
    });
    findByIdForSite.mockResolvedValue(record);
    setActive.mockResolvedValue({ ...record, isActive: false });

    const dto = await service.patchActive(record.siteId, 'IN', record.id, {
      isActive: false,
    });

    expect(updateUserStatus).toHaveBeenCalledWith('user-1', 'INACTIVE');
    expect(dto.isActive).toBe(false);
  });

  it('throws when application missing', async () => {
    findByIdForSite.mockResolvedValue(null);
    await expect(
      service.getApplication('site', 'IN', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
