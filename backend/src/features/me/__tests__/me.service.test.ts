jest.mock('@/lib/cloudinary', () => ({
  CloudinaryError: class CloudinaryError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'CloudinaryError';
    }
  },
  uploadSingleImage: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { uploadSingleImage } from '@/lib/cloudinary';
import { authService } from '@/features/auth/auth.service';
import { MeService } from '../me.service';
import type { MeRepository } from '../me.repository';

const uploadSingleImageMock = uploadSingleImage as jest.MockedFunction<
  typeof uploadSingleImage
>;

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'ada@skindx.test',
    firstName: 'Ada',
    lastName: 'Lovelace',
    imageUrl: null,
    role: 'CUSTOMER',
    status: 'ACTIVE',
    passwordHash: 'hash',
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    siteMemberships: [],
    externalIdentities: [],
    ...overrides,
  };
}

describe('MeService avatar', () => {
  const repository = {
    findCustomerById: jest.fn(),
    updateImageUrl: jest.fn(),
  } as unknown as jest.Mocked<MeRepository>;

  const service = new MeService(repository);
  const toUserDtoSpy = jest.spyOn(authService, 'toUserDto');

  beforeEach(() => {
    jest.clearAllMocks();
    toUserDtoSpy.mockImplementation((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      hasPassword: Boolean(user.passwordHash),
      linkedProviders: [],
      createdAt: user.createdAt.toISOString(),
    }));
  });

  it('uploads an image and persists imageUrl', async () => {
    const user = makeUser();
    const updated = makeUser({ imageUrl: 'https://cdn.example.com/a.jpg' });
    repository.findCustomerById.mockResolvedValue(user as never);
    uploadSingleImageMock.mockResolvedValue({
      url: 'https://cdn.example.com/a.jpg',
      publicId: 'skindx/shared/profile/u1',
      assetId: 'asset',
      format: 'jpg',
      bytes: 1200,
      width: 200,
      height: 200,
    } as never);
    repository.updateImageUrl.mockResolvedValue(updated as never);

    const file = {
      originalname: 'avatar.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('x'),
      size: 1,
    } as Express.Multer.File;

    const result = await service.uploadAvatar(user.id, file);

    expect(uploadSingleImageMock).toHaveBeenCalledWith(
      file,
      expect.objectContaining({
        siteCode: 'SHARED',
        feature: 'profile',
        entityId: user.id,
      }),
    );
    expect(repository.updateImageUrl).toHaveBeenCalledWith(
      user.id,
      'https://cdn.example.com/a.jpg',
    );
    expect(result.user.imageUrl).toBe('https://cdn.example.com/a.jpg');
  });

  it('rejects missing file', async () => {
    repository.findCustomerById.mockResolvedValue(makeUser() as never);
    await expect(service.uploadAvatar('11111111-1111-4111-8111-111111111111', undefined)).rejects.toMatchObject(
      { statusCode: 422, message: 'No file uploaded' },
    );
  });

  it('clears imageUrl', async () => {
    const user = makeUser({ imageUrl: 'https://cdn.example.com/a.jpg' });
    const cleared = makeUser({ imageUrl: null });
    repository.findCustomerById.mockResolvedValue(user as never);
    repository.updateImageUrl.mockResolvedValue(cleared as never);

    const result = await service.clearAvatar(user.id);
    expect(repository.updateImageUrl).toHaveBeenCalledWith(user.id, null);
    expect(result.user.imageUrl).toBeNull();
  });
});
describe("MeService storefront roles", () => {
  const repository = {
    findCustomerById: jest.fn(),
    listAddresses: jest.fn(),
  } as unknown as jest.Mocked<MeRepository>;

  const service = new MeService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows VENDOR to list addresses", async () => {
    repository.findCustomerById.mockResolvedValue(
      makeUser({ role: "VENDOR", username: "acmelabs01" }) as never,
    );
    repository.listAddresses.mockResolvedValue([] as never);
    await expect(service.listAddresses("11111111-1111-4111-8111-111111111111")).resolves.toEqual([]);
  });
});
