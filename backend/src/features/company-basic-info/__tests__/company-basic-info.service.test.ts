import {
  CompanyBasicInfoService,
  emptyCompanyBasicInfoDto,
  toCompanyBasicInfoDto,
} from '../company-basic-info.service';
import type { CompanyBasicInfoRepository } from '../company-basic-info.repository';
import type { CompanyBasicInfoRecord } from '../company-basic-info.types';

function makeRecord(overrides: Partial<CompanyBasicInfoRecord> = {}): CompanyBasicInfoRecord {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    siteId: '22222222-2222-2222-2222-222222222222',
    companyName: 'SkinDx',
    companyDomainName: 'skindxbioceuticals.in',
    contactNumbers: ['9876543210'],
    whatsappNumber: '9876543210',
    mainLogoUrl: 'https://cdn.example.com/main.png',
    mainLogoPublicId: 'branding/main',
    footerLogoUrl: '',
    footerLogoPublicId: '',
    mobileUiLogoUrl: '',
    mobileUiLogoPublicId: '',
    emails: ['hello@skindxbioceuticals.in'],
    officeAddresses: ['Mumbai'],
    googleAddress: '',
    googleUrl: '',
    googleLink: '',
    facebookLink: '',
    instagramLink: '',
    youtubeLink: '',
    googleMapLink: '',
    googleTrackingTag: '',
    titleTagForMainLandingPage: 'Home',
    keywords: ['skincare'],
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('CompanyBasicInfoService', () => {
  const findBySiteId = jest.fn();
  const upsertBySiteId = jest.fn();
  const repository = {
    findBySiteId,
    upsertBySiteId,
  } as unknown as CompanyBasicInfoRepository;

  const service = new CompanyBasicInfoService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty defaults when no record exists', async () => {
    findBySiteId.mockResolvedValue(null);
    const dto = await service.getForSite('site-1', 'IN');
    expect(dto).toEqual(emptyCompanyBasicInfoDto('IN'));
  });

  it('maps an existing record to DTO', async () => {
    const record = makeRecord();
    findBySiteId.mockResolvedValue(record);
    const dto = await service.getForSite(record.siteId, 'IN');
    expect(dto).toEqual(toCompanyBasicInfoDto(record, 'IN'));
    expect(dto.mainLogo).toEqual({
      url: 'https://cdn.example.com/main.png',
      publicId: 'branding/main',
    });
  });

  it('upserts using siteId from context and ignores client ownership', async () => {
    const record = makeRecord({ companyName: 'Updated' });
    upsertBySiteId.mockResolvedValue(record);

    const dto = await service.upsertForSite({
      siteId: record.siteId,
      siteCode: 'COM',
      userId: 'user-1',
      body: {
        companyName: 'Updated',
        companyDomainName: 'skindxbioceuticals.com',
        contactNumbers: ['9876543210'],
        whatsappNumber: '',
        mainLogo: { url: '', publicId: '' },
        footerLogo: { url: '', publicId: '' },
        mobileUiLogo: { url: '', publicId: '' },
        emails: [],
        officeAddresses: [],
        googleAddress: '',
        googleUrl: '',
        googleLink: '',
        facebookLink: '',
        instagramLink: '',
        youtubeLink: '',
        googleMapLink: '',
        googleTrackingTag: '',
        titleTagForMainLandingPage: '',
        keywords: [],
      },
    });

    expect(upsertBySiteId).toHaveBeenCalledWith(
      record.siteId,
      expect.objectContaining({
        companyName: 'Updated',
        companyDomainName: 'skindxbioceuticals.com',
      }),
    );
    expect(dto.siteCode).toBe('COM');
    expect(dto.companyName).toBe('Updated');
  });
});
